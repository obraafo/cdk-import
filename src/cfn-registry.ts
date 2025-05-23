import {
  DescribeTypeCommandInput,
  DescribeTypeCommandOutput,
  ListTypesCommandInput,
  ListTypesCommandOutput,
} from '@aws-sdk/client-cloudformation';

import { TypeInfo } from './type-info';

export interface ICloudFormationClient {
  listTypes(input: ListTypesCommandInput): Promise<ListTypesCommandOutput>;
  describeType(input: DescribeTypeCommandInput): Promise<DescribeTypeCommandOutput>;
}

export interface DescribeResourceTypeOptions {
  /**
   * Query with VISIBILITY=PRIVATE which means you can only import types that
   * are registred in your account (either types that you created or public
   * types that you activated).
   */
  readonly private?: boolean;

  /**
   * A client that performs calls to CloudFormation. You can provide a mock here
   * for testing.
   *
   * @default - A real CloudFormation client
   */
  readonly client?: ICloudFormationClient;
}

/**
 * Calls the CFN resource type registry to fetch the type definition
 *
 * @param name the name or unique prefix of the resource type
 * @returns the type definition
 */
export async function describeResourceType(name: string, options: DescribeResourceTypeOptions = {}): Promise<TypeInfo> {
  const visibility = options.private ? 'PRIVATE' : 'PUBLIC';
  const cfn = options.client ?? new CloudFormationClient();

  let typeArn;

  if (name.startsWith('arn:')) {
    typeArn = name;
  } else {
    const types = [];
    let token;
    do {
      const res: ListTypesCommandOutput = await cfn.listTypes({
        NextToken: token,
        Type: name.endsWith('MODULE') ? 'MODULE' : 'RESOURCE',
        Filters: {
          TypeNamePrefix: name,
        },
        Visibility: visibility,
      });

      if (res.TypeSummaries) {
        types.push(...res.TypeSummaries);
      }
      token = res.NextToken;
    } while (token);

    if (types.length !== 1) {
      throw new Error('Cannot find unique CloudFormation Type ' + name);
    }

    typeArn = types[0].TypeArn;
  }

  const type = await cfn.describeType({
    Arn: typeArn,
    // TODO versioning
  });
  if (!type.Schema) {
    throw new Error('CloudFormation Type ' + name + ' does not contain schema');
  }
  if (!type.TypeName) {
    throw new Error('CloudFormation Type ' + name + ' does not contain a type name');
  }
  return {
    TypeName: type.TypeName,
    Schema: type.Schema,
    SourceUrl: type.SourceUrl ?? type.Arn!,
  };
}

class CloudFormationClient implements ICloudFormationClient {
  private readonly cfn: CloudFormationClient;

  constructor() {
    this.cfn = new CloudFormationClient();
  }

  public async describeType(input: DescribeTypeCommandInput): Promise<DescribeTypeCommandOutput> {
    return this.cfn.describeType(input);
  }

  public async listTypes(input: ListTypesCommandInput): Promise<ListTypesCommandOutput> {
    return this.cfn.listTypes(input);
  }
}