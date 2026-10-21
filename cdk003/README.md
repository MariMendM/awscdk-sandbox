# AWS: Creation of ECS hosting a REST API, with Development Tools for build and deploy

Description: This project creates a stack deploying a CodePipeline (with Build/Deploy) to build a docker image with a C++ REST API, pushing it into ECR, and deploying it to ECS. No CDK provided for this project; the stack can be created by uploading the [cfn-reference-template.yml](cfn-reference-template.yml) into CloudFormation console.

The CloudFormation template provision the same set of resources, namely:
* 1 VPC;
* 1 subnet (public);
* 1 route table (pub subnet);
* 1 internet gateway (route in pub route table);
* 1 NACLs (pub traffic);
* 1 security group for ECS Task Definition (in pub subnet);
* 1 security group for ELB of pub ecs;
* 1 application ELBs (for pub ecs) + TargetGroups/Listeners;
* 1 ECS Cluster;
* 1 ECS Service;
* 1 ECS Task Definition;
* 2 S3 buckets (Code Services Artifacts, CloudTrail logs)
* 1 S3 bucket policy (for bucket CloudTrail logs)
* 1 EventBridge Rule for Code Services to monitor bucket artifacts for new version of source code
* 1 CloudTrail enabling object-level data logging events for the S3 artifact bucket, allowing EventBridge to capture them
* 1 CodePipeline for app/container (source reading from S3 + CodeBuild + deploy target to ECS);
* 5 IAM roles (CodePipeline, CodeBuild, ECS Task Definition Execution, ECS Task Definition, EventBridge Target);

By default the creation of a VPC also deploys a NACL and a SecGroup not reachable for changes by CloudFormation. The region of deploy of stack is mostly parameterized to use the region of deployment, but it may be hard-coded here and there as 'us-east-1' (not deeply checked).

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

<ins>BUILD STAGE</ins>: Accomplished by CodeBuild, this stage compiles the C++ REST API, and creates the docker image, pushing it to the ECR repo. As artifacts, it produces the 'imagedefinitions.json' file according to AWS guidelines, containing the name of the container and the ECS URI of the image. This file is mandatory for the deploy stage.

<ins>DEPLOY STAGE</ins>: This stage uses ECS as Action Provider, reading the information of 'imagedefinitions.json' to get the ECR URI and push the built base image into the ECS Service/Cluster. The result is the creation of a new revision for the ECS Task Definition, with the update of the ECS Service to spin a new running task using the new revision (i.e., the built image running into a new container)

## Notes and improvement opportunities

* The artifacts bucket for the CodePipeline/CodeBuild is created within the Stack. This means that as soon as the pipeline is created, it already runs and fails, once the bucket is empty. After stack creation, the file 'code.zip' must de uploaded to the bucket.

* The C++ REST API runs in the container binded to the Host IP, which ties it to the private IP assigned to the container. That allows the API to be accessed properly, but prevents health checks from being configured, once they can only use the localhost for calls. The solution was to create an environment variable to the container (within Task Definition configuration) pointing HOSTNAME to 0.0.0.0, which allows the application to listen from all network interfaces. It seems that ECS injects/overrides HOSTNAME with something else, so it has to be reset; this allows both application and health checks to work properly.

* ECS in configured in a public subnet (no AZ resilience, no balancer), with SG and NACL allowing ports 80, 8080 (the one that application is actually binded to) and 443 (required for pull frm ECS, for example). The NACL also allows traffic from ephemeral ports, considering that they are required fro troubleshoot of containers (installing things, for example). The ports do not reflect a secure posture, as much as they are mainly used for demo purposes.

* When configured with a 'desired count' different from zero in the CloudFormation template, the ECS Service gets stucked in "in progress" state in the Stack while the desired count is not reached. Given that a file must de uploaded to the bucket artifacts, the Pipeline must run, and an container image must be pushed to ECR before a task can successfully run in the Service, the template is configured with 'desired count' equals to zero for Stack properly creation. Then, it can be manually adjusted in the console for the service when everything is up and running.

* For the pipeline to be automatically triggered everytime the source code file is uploaded into the Bucket Artifacts, it is necessary to create an EventBridge Rule that reacts to write S3 events over objects (like 'PutObject'). Those events must be captured by CloudTrail, which doesn't happen by default. So a Trail is created to enable object-level data logging events for S3 (with respective role and bucket/bucket policy for logs), allowing EventBridge rule to wokr properly.

## ECS Exec for troubleshooting ECS containers

In order to run ECS Exec (docker exec -it container bash) in a running container:
* the Task Definition must have proper IAM permissions (configured in template's resource 'RoleIAM4EcsTaskRole');
* the service must enable it ('EnableExecuteCommand: true' in template's resource 'ECSService')
* the following commands should be run in a CloudShell session (check option to "bin/bash" depending of the distro):

```
aws ecs execute-command \
--cluster CLUSTER_NAME \
--task TASK_ID \
--container CONTAINER_NAME \
--interactive \
--command "/bin/bash"
```

Some commands that may help with troubleshooting configurations:

```
aws ecs describe-tasks --cluster CLUSTER_NAME --tasks TASK_ID
```

## Testing

* Create the stack;
* After stack completed, update the ECS Service (Quick Update) and set desired count to 1
  * the service will spin a new running task;
* Upload the 'code.zip' file (prepared according to the instructions laid before in this document) into the bucket created for the artifacts of the pipeline (name in the outputs of the stack)
  * the pipeline will start running;
* Once the pipeline finishes, the ECR Service will have a new Task running over the new Task Definition Revision created by the Deploy Stage of the pipeline;
  * the task will soon enter 'running' state with a 'healthy' status;
  * access the API through curl (more test options in the [API documentation](https://github.com/MariMendM/cpp-sandbox/tree/main/rest-api)
```
curl -v http://<TASK-PUBLIC-IP>:8080/api
``` 

Note: the API is just a shell, implementing nothing more than /api (which is used for health check), and /api/resource-a (printing a simple message). Other methods and resources return success, but with a mere message of "not implemented". The API is not the main reason of this project, it is just a bare minimum to test AWS services connected!