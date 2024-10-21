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
                git branch: 'main', url: "https://github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git"
            }
        }

        stage('Update Deployment File') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'TOKEN')]) {

                        sh "sed -i 's|image: .*|image: $IMAGE_TAG|' prod/deployement.yaml"

                        sh 'git config user.name "zeliododo"'
                        sh 'git config user.email "zeliododo0815@gmail.com"'

                        sh 'git add prod/deployement.yaml'
                        sh "git commit -m 'Update deployment image to $IMAGE_TAG'"
                        sh "git push https://$TOKEN@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git"
                    }
                }
            }     
        }

        stage ("Docker Pull Dastardly from Burp Suite container image") {
            steps {
                sh 'docker pull public.ecr.aws/portswigger/dastardly:latest'
            }
        }

        stage ("Docker run Dastardly from Burp Suite Scan") {
            steps {
                cleanWs()
                sh '''
                    docker run --user $(id -u) -v ${WORKSPACE}:${WORKSPACE}:rw \
                    -e BURP_START_URL=http://a7042e445de634b90894d0b193d8a1ee-1439731728.us-east-1.elb.amazonaws.com/ \
                    -e BURP_REPORT_FILE_PATH=${WORKSPACE}/dastardly-report.xml \
                    public.ecr.aws/portswigger/dastardly:latest
                '''
            }
        }
    }

    post {
        always {
            junit testResults: 'dastardly-report.xml', skipPublishingChecks: true
            sh 'docker rmi ${IMAGE_TAG}'
        }
        failure {
            emailext(
                subject: "${JOB_NAME}.${BUILD_NUMBER} FAILED",
                mimeType: 'text/html',
                to: "zelio@nexthope.net",
                body: "${JOB_NAME}.${BUILD_NUMBER} FAILED"
            )    
        }
        success {
            emailext(
                subject: "${JOB_NAME}.${BUILD_NUMBER} PASSED",
                mimeType: 'text/html',
                to: "zelio@nexthope.net",
                body: "${JOB_NAME}.${BUILD_NUMBER} PASSED"
            )
        }    
    }
}
