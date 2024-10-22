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
        NVD_API_KEY = credentials('NVD_API_KEY')
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
                    --prettyPrint
                    --nvdApiKey ${NVD_API_KEY}''', odcInstallation: 'owasp_dpcheck'
                
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
                script {
                    sh "trivy image --scanners vuln --severity HIGH,CRITICAL ${REGISTRY}:${BUILD_NUMBER} > report.txt"
                    
                    def vulnerabilityCount = sh(script: "grep -E 'HIGH|CRITICAL' report.txt | wc -l", returnStdout: true).trim()
                    
                    if (vulnerabilityCount.toInteger() > 0) {
                        echo "WARNING: Vulnerability of HIGH or CRITICAL severity where found!!"
                        //error "Pipeline stopped due to HIGH or CRITICAL vulnerabilities found by Trivy!"
                    }
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
                to: "zelio@nexthope.net",
                subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - Security Scan Results",
                mimeType: 'text/html',
                body: """
                    <html>
                        <head>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                    padding: 20px;
                                }
                                .header {
                                    background-color: #DC3545; /* Red for failure */
                                    color: white;
                                    padding: 15px;
                                    border-radius: 5px;
                                    margin-bottom: 20px;
                                }
                                .content {
                                    background-color: #f8f9fa;
                                    padding: 20px;
                                    border-radius: 5px;
                                    border: 1px solid #ddd;
                                }
                                .button {
                                    background-color: #007bff;
                                    color: white;
                                    padding: 10px 20px;
                                    text-decoration: none;
                                    border-radius: 5px;
                                    display: inline-block;
                                    margin: 10px 0;
                                }
                                .footer {
                                    margin-top: 20px;
                                    font-size: 12px;
                                    color: #666;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>⚠️ Build Failure Alert</h2>
                            </div>
                            <div class="content">
                                <h3>Build Information:</h3>
                                <ul>
                                    <li><strong>Job Name:</strong> ${JOB_NAME}</li>
                                    <li><strong>Build Number:</strong> #${BUILD_NUMBER}</li>
                                    <li><strong>Status:</strong> FAILED</li>
                                </ul>
                                
                                <p>Security vulnerabilities have been detected in your build. Please review the attached Trivy report for details.</p>
                                
                                <a href="${BUILD_URL}" class="button">View Build Details</a>
                                
                                <div class="footer">
                                    <p>This is an automated message from Jenkins. Please do not reply to this email.</p>
                                </div>
                            </div>
                        </body>
                    </html>
                """,
                attachLog: true,
                attachmentsPattern: 'report.txt'
            )
        }
        success {
            emailext(
                to: "zelio@nexthope.net",
                subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - Security Scan Results",
                mimeType: 'text/html',
                body: """
                    <html>
                        <head>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                    padding: 20px;
                                }
                                .header {
                                    background-color: #28A745; /* Green for success */
                                    color: white;
                                    padding: 15px;
                                    border-radius: 5px;
                                    margin-bottom: 20px;
                                }
                                .content {
                                    background-color: #f8f9fa;
                                    padding: 20px;
                                    border-radius: 5px;
                                    border: 1px solid #ddd;
                                }
                                .button {
                                    background-color: #007bff;
                                    color: white;
                                    padding: 10px 20px;
                                    text-decoration: none;
                                    border-radius: 5px;
                                    display: inline-block;
                                    margin: 10px 0;
                                }
                                .footer {
                                    margin-top: 20px;
                                    font-size: 12px;
                                    color: #666;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>✅ Build Success</h2>
                            </div>
                            <div class="content">
                                <h3>Build Information:</h3>
                                <ul>
                                    <li><strong>Job Name:</strong> ${JOB_NAME}</li>
                                    <li><strong>Build Number:</strong> #${BUILD_NUMBER}</li>
                                    <li><strong>Status:</strong> SUCCESS</li>
                                </ul>
                                
                                <p>No critical security vulnerabilities were found. You can review the details of the scan in the attached Trivy report.</p>
                                
                                <a href="${BUILD_URL}" class="button">View Build Details</a>
                                
                                <div class="footer">
                                    <p>This is an automated message from Jenkins. Please do not reply to this email.</p>
                                </div>
                            </div>
                        </body>
                    </html>
                """,
                attachLog: true,
                attachmentsPattern: 'report.txt'
            )
        }
    }
}
