pipeline {
    agent any
    tools{
        nodejs 'Nodejs'
    }

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

        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: 'Nodejs') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Sonarqube') {
            environment {
                scannerHome = tool 'sonarqube_tool';
            }
            steps {
              withSonarQubeEnv(credentialsId: 'sonarqube_token', installationName: 'sonarqube_server') {
                sh "${scannerHome}/bin/sonar-scanner"
              }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonarqube_token'
                }
            }
        }

        stage('OWASP Checking') {
            steps {
                nodejs(nodeJSInstallationName: 'Nodejs') {
                    sh 'npm audit -j > node_audit.json || true'
                }
                dependencyCheck additionalArguments: '''
                    -o './'
                    -s './'
                    -f 'ALL'
                    --prettyPrint
                    --nodePackageFile package.json
                    --nodeAuditJsonFile node_audit.json''', odcInstallation: 'owasp_dpcheck'
                
                dependencyCheckPublisher pattern: 'dependency-check-report.xml'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${REGISTRY}:${BUILD_NUMBER}", ".")
                }
            }
        }

        stage('Trivy Vulnerability Scan') {
            steps {
                sh "trivy image --scanners vuln --severity HIGH,CRITICAL ${REGISTRY}:${BUILD_NUMBER} > report.txt"
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
                    dockerImage.push("${BUILD_NUMBER}")
                    dockerImage.push('latest')
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                script {
                    sh 'docker rmi ${IMAGE_TAG}'
                    sh 'rm report.txt'
                }
            }
        }
    }
}
