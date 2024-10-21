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
        GIT_REPO_NAME = "manifest-repo"
        GIT_USER_NAME = "zeliododo"
    }
    
    stages {

        stage('Cleanup') {
            steps {
                cleanWs()
            }
        }

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
                dependencyCheck additionalArguments: '''
                    -o './'
                    -s './'
                    -f 'ALL'
                    --prettyPrint''', odcInstallation: 'owasp_dpcheck'
                
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

        stage('Checkout Manifest Code') {
            steps {
                git branch: 'main', url: 'https://github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git'
            }
        }

        stage('Update Deployment File') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github', variable: 'GITHUB_TOKEN')]) {

                        sh "sed -i 's|image: .*|image: $IMAGE_TAG|' prod/deployment.yml"

                        sh 'git config user.name "zeliododo"'
                        sh 'git config user.email "zeliododo0815@gmail.com"'

                        sh 'git add .'
                        sh "git commit -m 'Update deployment image to $IMAGE_TAG'"
                        sh 'git push https://$GITHUB_TOKEN@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git"'
                    }
                }
            }     
        }

        stage('Clean Up') {
            steps {
                script {
                    sh 'docker rmi ${IMAGE_TAG}'
                }
            }
        }
    }

    post {
        success {
            emailext(
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Good news! Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' succeeded.",
                attachmentsPattern: 'report.txt',
                to: 'zeliododo0815@gmail.com'              
            )

            sh 'rm -f report.txt'
        }
        failure {
            emailext(
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Unfortunately, Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' failed. Please check the logs.",
                attachmentsPattern: 'report.txt',
                attachLog: true,
                to: 'zeliododo0815@gmail.com'
            )

            sh 'rm -f report.txt'
        }
    }
}
