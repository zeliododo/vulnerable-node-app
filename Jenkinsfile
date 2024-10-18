pipeline {
    agent any
    
    environment {
        registryCredential = 'aws_credentials'
        appRegistry = '637423230477.dkr.ecr.us-east-1.amazonaws.com/vulnerable_node_app'
        registry = 'https://637423230477.dkr.ecr.us-east-1.amazonaws.com'
    }
    
    stages {
        stage('Clean the workspace') {
            steps {
                cleanWs()
            }
        }
        
        stage('Checkout the project from github repo') {
            steps {
                git branch: 'main', url: 'https://github.com/zeliododo/vulnerable-node-app.git'
            }
        }
        
        stage('Build App Image') {
            steps {
                script {
                    dockerImage = docker.build("${appRegistry}:${BUILD_NUMBER}", "./")
                }
            }
        }
        
        stage('Upload App Image') {
            steps {
                script {
                    docker.withRegistry(registry, registryCredential) {
                        dockerImage.push("${BUILD_NUMBER}")
                        dockerImage.push('latest')
                    }
                }
            }
        }
    }
}