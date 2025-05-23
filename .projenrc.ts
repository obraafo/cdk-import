import { CdklabsTypeScriptProject } from 'cdklabs-projen-project-types';

const project = new CdklabsTypeScriptProject({
  name: 'cdk-import',
  repository: 'https://github.com/cdklabs/cdk-import',
  projenrcTs: true,
  private: false,
  enablePRAutoMerge: true,
  description: 'Toolkit to import CFN resource types and generate L1 constructs',
  defaultReleaseBranch: 'main',
  deps: [
    'json2jsii',
    '@aws-sdk/client-cloudformation',
    '@aws-sdk/client-service-catalog',
    'aws-cdk-lib',
    'constructs@^10',
    'minimist',
    'minimist-subcommand',
    'proxy-agent',
    'case',
    'jsii-srcmak',
  ],
  devDeps: [
    'jsii',
    'ts-node',
    'aws-cdk-lib',
    'constructs@^10',
    'cdklabs-projen-project-types',
  ],
  bin: {
    'cdk-import': 'lib/cli.js',
  },
  tsconfig: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  releaseToNpm: true,

  minNodeVersion: '16.0.0',

  autoApproveUpgrades: true,
  autoApproveOptions: { allowedUsernames: ['cdklabs-automation'], secret: 'GITHUB_TOKEN' },
});

project.addGitIgnore('/.tmp/');
project.addPackageIgnore('/.tmp/');

// we use jsii for testing, and the current jsii
// compiles projects with typescript < 4.0
// need to pin some @types packages to older versions
project.package.addPackageResolutions(
  '@types/prettier@2.6.0',
  '@types/babel__traverse@7.18.2',
);

// not using `npmAccess` property because projen omits values that are
// identical to npm defaults.
project.package.addField('publishConfig', { access: 'public' });

project.synth();
