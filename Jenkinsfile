pipeline {
    agent any
    
    tools {
        nodejs 'Nodejs'
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        REPOSITORY_URL = '637423230477.dkr.ecr.us-east-1.amazonaws.com'
        REGISTRY = "${REPOSITORY_URL}/vulnerable_node_app"
        IMAGE_TAG = "${REGISTRY}:${BUILD_NUMBER}"
        
        ECR_LOGIN_COMMAND = "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URL}"
        
        GIT_REPO_NAME = 'manifest-repo'
        GIT_USER_NAME = 'zeliododo'
        GIT_USER_EMAIL = 'zeliododo0815@gmail.com'
        
        APP_URL = 'http://a7042e445de634b90894d0b193d8a1ee-1439731728.us-east-1.elb.amazonaws.com/'
    }
    
    stages {
        stage('Initialize') {
            steps {
                cleanWs()
                git branch: 'main', url: 'https://github.com/zeliododo/vulnerable-node-app.git'
            }
        }

        stage('Build & Test') {
            steps {
                nodejs(nodeJSInstallationName: 'Nodejs') {
                    sh 'npm install'
                }
            }
        }

        stage('Static Code Analysis') {
            stages {
                stage('SonarQube Analysis') {
                    environment {
                        scannerHome = tool 'sonarqube_tool'
                    }
                    steps {
                        withSonarQubeEnv(credentialsId: 'SONAR-TOKEN', installationName: 'sonarqube_server') {
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    }
                }

                stage('Quality Gate') {
                    steps {
                        waitForQualityGate abortPipeline: false, credentialsId: 'SONAR-TOKEN'
                    }
                }
            }
        }
        
        stage('Security Scanning') {
            stages {
                stage('Snyk Setup') {
                    steps {
                        nodejs(nodeJSInstallationName: 'Nodejs') {
                            withCredentials([string(credentialsId: 'SNYK_TOKEN', variable: 'SNYK_TOKEN')]) {
                                sh '''
                                    npm install -g snyk
                                    npm install snyk-to-html -g
                                    snyk auth $SNYK_TOKEN
                                '''
                            }
                        }
                    }
                }

                stage('Snyk Scans') {
                    stages {
                        stage('Dependencies (SCA)') {
                            steps {
                                script {
                                    sh "ls -al"
                                    def result = sh(
                                        script: 'snyk test --json | snyk-to-html -o sca-result.html',
                                        returnStatus: true
                                    )
                                    if (result == 1) {
                                        echo "Critical vulnerabilities found in dependencies!"
                                    }
                                }
                            }
                        }   
                        stage('Source Code (SAST)') {
                            steps {
                                script {
                                    def result = sh(
                                        script: 'snyk code test --json | snyk-to-html -o sast-result.html',
                                        returnStatus: true
                                    )
                                    if (result == 1) {
                                        echo "Critical vulnerabilities found in source code!"
                                    }
                                }
                            }
                        }
                    }       
                }
            }
        }

        stage('Container Operations') {
            stages {
                stage('Build & Scan Image') {
                    steps {
                        script {
                            dockerImage = docker.build("${REGISTRY}:${BUILD_NUMBER}", ".")
                            
                            def scanResult = sh(
                                script: "snyk container test ${IMAGE_TAG} --json | snyk-to-html -o container-scan-result.html",
                                returnStatus: true
                            )
                            if (scanResult == 1) {
                                echo "Critical vulnerabilities found in container image!"
                            }
                        }
                    }
                }

                stage('Push to ECR') {
                    steps {
                        script {
                            sh "${ECR_LOGIN_COMMAND}"
                            dockerImage.push("${BUILD_NUMBER}")
                            dockerImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Update Deployment Staging') {
            steps {
                git branch: 'main', url: "https://github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git"
                
                script {
                    withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'TOKEN')]) {
                        sh """
                            sed -i 's|image: .*|image: ${IMAGE_TAG}|' staging/deployement.yaml
                            git config user.name "${GIT_USER_NAME}"
                            git config user.email "${GIT_USER_EMAIL}"
                            git add staging/deployement.yaml
                            git commit -m 'Update deployment image to ${IMAGE_TAG}'
                            git push https://\$TOKEN@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git
                        """
                    }
                }
            }
        }

        stage('Wait for Application') {
            steps {
                echo 'Waiting for 3 minutes to allow the application to fully start...'
                //sleep time: 2, unit: 'MINUTES'
            }
        }

        stage('Dynamic Security Testing') {
            steps {
                /* sh '''
                    docker pull public.ecr.aws/portswigger/dastardly:latest
                    docker run --user $(id -u) -v ${WORKSPACE}:${WORKSPACE}:rw \
                        -e BURP_START_URL=${APP_URL} \
                        -e BURP_REPORT_FILE_PATH=${WORKSPACE}/dastardly-report.xml \
                        public.ecr.aws/portswigger/dastardly:latest
                ''' */
                echo 'Dynamic Testing successfull'
            }
        }

        stage('Update Deployment') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'GITHUB_TOKEN', variable: 'TOKEN')]) {
                        sh """
                            sed -i 's|image: .*|image: ${IMAGE_TAG}|' prod/deployement.yaml
                            git config user.name "${GIT_USER_NAME}"
                            git config user.email "${GIT_USER_EMAIL}"
                            git add prod/deployement.yaml
                            git commit -m 'Update deployment image to ${IMAGE_TAG}'
                            git push https://\$TOKEN@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker rmi ${IMAGE_TAG}
                docker rmi ${REGISTRY}:latest
            '''
        }
        
        success {
            emailext(
                to: 'zelio@nexthope.net',
                subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - Security Scan Results",
                mimeType: 'text/html',
                body: '''
                    <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                                .header { background-color: #28A745; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                                .content { background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd; }
                                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                                .footer { margin-top: 20px; font-size: 12px; color: #666; }
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
                                <p>No critical security vulnerabilities were found. You can review the details of the scan in the attached report.</p>
                                <a href="${BUILD_URL}" class="button">View Build Details</a>
                                <div class="footer">
                                    <p>This is an automated message from Jenkins. Please do not reply to this email.</p>
                                </div>
                            </div>
                        </body>
                    </html>
                ''',
                attachLog: true,
                attachmentsPattern: 'sca-result.html, sast-result.html, container-scan-result.html'
            )
        }
        
        failure {
            emailext(
                to: 'zelio@nexthope.net',
                subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - Security Scan Results",
                mimeType: 'text/html',
                body: '''
                    <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                                .header { background-color: #DC3545; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                                .content { background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd; }
                                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                                .footer { margin-top: 20px; font-size: 12px; color: #666; }
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
                                <p>Security vulnerabilities have been detected in your build. Please review the attached report for details.</p>
                                <a href="${BUILD_URL}" class="button">View Build Details</a>
                                <div class="footer">
                                    <p>This is an automated message from Jenkins. Please do not reply to this email.</p>
                                </div>
                            </div>
                        </body>
                    </html>
                ''',
                attachLog: true,
                attachmentsPattern: 'sca-result.html, sast-result.html, container-scan-result.html'
            )
        }
    }
}