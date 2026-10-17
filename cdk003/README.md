# CDK Typescript: Creation of ECS hosting a REST API, with Development Tools for build and deploy

Description: This CDK creates a stack deploying a CodePipeline (with Build/Deploy) to build a docker image with a C++ REST API, pushing it into ECR, and deploying it to ECS. The same stack can be created by uploading the [cfn-reference-template.yml](cfn-reference-template.yml) into CloudFormation console.

Both the CDK and the CloudFormation template provision the same set of resources, namely:
* 1 S3 Bucket (private), with versioning enabled, for CodePipeline artifacts
* 1 IAM Full-access Policy to the S3 Bucket
* ...

The region of deploy of stack is currently hard-coded inside bin/cdk003.ts as 'us-east-1'.

## CodePipeline: preparing file with code for source stage

<ins>SOURCE STAGE</ins>: This project uses the C++ REST API from the repo [MariMendM/cpp-sandbox](https://github.com/MariMendM/cpp-sandbox). Considering it will not focus on the connection to repositories, the source code stage from the pipeline will be simplified by using a zip file manually dropped within and S3 Bucket. The file has to be prepared by:
* locally downloading the content of this cdk003 project folder;
* locally downloading the folder 'rest-api' from [MariMendM/cpp-sandbox](https://github.com/MariMendM/cpp-sandbox) containing the code of the C++ REST API;
* zipping it all toghether.
Final required strucuture of the file:

```
	code.zip
	|___ rest-api
		 |___ dependencies
		 |___ src
		 |___ ...
	|___ buildspec.yml
	|___ dockerfile
	|___ README.md
```

The name of the file has to be the same value input in the Stack variable 'Filename of zipped code to be uploaded to S3' (default value 'code.zip'). After the creation of the stack, the file has to be manually uploaded into to the artifacts bucket created by the stack, whose name can be acquired from the outputs of the stack.
The pipeline automatically creates an EventBridge rule monitoring the artifacts bucket for the file (meaning it is not defined in the CFn/CDK), and this rule takes effect immediatelly upon pipeline creation; pipeline's first run will then fail due to the lack of the file. Each subsequent upload of the file in the bucket will automatically trigger the pipeline.

<ins>BUILD STAGE</ins>: Accomplished by CodeBuild, this stage compiles the C++ REST API, and creates the docker image, pushing it to the ECR repo.

<ins>DEPLOY STAGE</ins>: Accomplished by CodeDeploy, this stage ensures that pushed ECR images are deployed to the ECS.


## Useful CDK commands

In all commands, OPTION must be either PRD or DEV.

 * `cdk deploy -c envType=OPTION`      deploy this stack to default AWS account
 * `cdk diff -c envType=OPTION`        compare deployed stack with current state
 * `cdk synth -c envType=OPTION`       emits the synthesized CloudFormation template

To export CloudFormation Outputs to file, use the command:

 * `cdk deploy -c envType=OPTION --outputs-file ./cdk-outputs.json`

## Testing

Create the stack, upload the 'code.zip' file prepared according to the instructions laid before in this document, and test the REST API:

- open...
- curl...