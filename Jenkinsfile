pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        REPOSITORY_URL = '637423230477.dkr.ecr.us-east-1.amazonaws.com'
        REGISTRY = '637423230477.dkr.ecr.us-east-1.amazonaws.com/vulnerable_node_app'
        IMAGE_TAG = "${REGISTRY}:${BUILD_NUMBER}"
        ECR_LOGIN_COMMAND = 'aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URL}'
    }
    
    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/zeliododo/vulnerable-node-app.git'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${REGISTRY}:${BUILD_NUMBER}", ".")
                }
            }
        }

        stage('Login to AWS ECR') {
            steps {
                script {
                    sh "${ECR_LOGIN_COMMAND}"
                }
            }
        }

        stage('Tag & Push Docker Image') {
            steps {
                script {
                    // Push the tagged image
                    dockerImage.push("${BUILD_NUMBER}")
                    dockerImage.push('latest')
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                sh 'docker rmi ${IMAGE_TAG}'
            }
        }
    }
}