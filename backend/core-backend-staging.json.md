{
  "compatibilities": [
    "EC2",
    "MANAGED_INSTANCES",
    "FARGATE"
  ],
  "containerDefinitions": [
    {
      "cpu": 0,
      "environment": [
        {
          "name": "postgres_user",
          "value": "postgres"
        },
        {
          "name": "database_url",
          "value": "postgresql://postgres:F4VXH0q837h0pBlt@Empressa-core-stage.c8zmkcois5wi.us-east-1.rds.amazonaws.com:5432/core_api_staging"
        },
        {
          "name": "postgres_password",
          "value": "F4VXH0q837h0pBlt"
        },
        {
          "name": "postgres_db",
          "value": "core_api_staging"
        }
      ],
      "environmentFiles": [],
      "essential": true,
      "image": "703761850003.dkr.ecr.us-east-1.amazonaws.com/core-backend-staging@sha256:3b4606a11917d5d44eaca4469ac63374083afd53154d28aa67d31e4d6040c342",
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/core-backend-staging",
          "awslogs-create-group": "true",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        },
        "secretOptions": []
      },
      "mountPoints": [],
      "name": "core-backend-staging",
      "portMappings": [
        {
          "appProtocol": "http",
          "containerPort": 80,
          "hostPort": 80,
          "name": "core-backend-staging-80-tcp",
          "protocol": "tcp"
        },
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "name": "core-backend-staging-3000-tcp",
          "protocol": "tcp"
        }
      ],
      "systemControls": [],
      "ulimits": [],
      "volumesFrom": []
    }
  ],
  "cpu": "1024",
  "enableFaultInjection": false,
  "executionRoleArn": "arn:aws:iam::703761850003:role/ecsTaskExecutionRole",
  "family": "core-backend-staging",
  "memory": "3072",
  "networkMode": "awsvpc",
  "placementConstraints": [],
  "registeredAt": "2025-11-04T08:09:02.322Z",
  "registeredBy": "arn:aws:iam::703761850003:user/devopsuser",
  "requiresAttributes": [
    {
      "name": "com.amazonaws.ecs.capability.logging-driver.awslogs"
    },
    {
      "name": "ecs.capability.execution-role-awslogs"
    },
    {
      "name": "com.amazonaws.ecs.capability.ecr-auth"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.19"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.21"
    },
    {
      "name": "ecs.capability.execution-role-ecr-pull"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.18"
    },
    {
      "name": "ecs.capability.task-eni"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.29"
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "revision": 3,
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "status": "ACTIVE",
  "taskDefinitionArn": "arn:aws:ecs:us-east-1:703761850003:task-definition/core-backend-staging:3",
  "volumes": [],
  "tags": []
}



------------

name: Deploy Staging to AWS ECS

on:
  push:
    branches:
      - staging
    tags:
      - 'v*-staging' # only trigger tags like v0.0.3-staging

env:
  AWS_REGION: ${{ vars.AWS_REGION }}
  ECR_REPOSITORY: ${{ vars.ECR_REPOSITORY }}
  ECS_CLUSTER: ${{ vars.ECS_CLUSTER }}
  ECS_SERVICE: ${{ vars.ECS_SERVICE }}
  ECS_TASK_DEFINITION: ${{ vars.ECS_TASK_DEFINITION }}
  CONTAINER_NAME: ${{ vars.CONTAINER_NAME }}

jobs:
  deploy:
    name: Build, Push, and Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        env:
          IMAGE_TAG: ${{ github.ref_name }}  # use branch name as tag (e.g., v0.0.4-staging)
        run: |
          docker build --build-arg APP_NAME=core-api --target production -t $ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REPOSITORY:$IMAGE_TAG ${{ steps.login-ecr.outputs.registry }}/$ECR_REPOSITORY:$IMAGE_TAG
          docker push ${{ steps.login-ecr.outputs.registry }}/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Render ECS task definition
        id: render-task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: core-api-backend-staging.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.ref_name }}

      # 🔧 Fix for "Unexpected key 'enableFaultInjection'"
      - name: Remove unsupported ECS fields
        run: |
          jq 'del(.enableFaultInjection)' ${{ steps.render-task-def.outputs.task-definition }} > task-def-cleaned.json

      - name: Deploy ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-def-cleaned.json
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: false