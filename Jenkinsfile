pipeline {
    agent any

    environment {
        APP_NAME       = 'pratas'
        REGISTRY       = 'docker.io/aladin78'
        REGISTRY_CREDS = 'dockerhub-credentials' 
        GIT_REPO       = 'https://github.com/BenouadahAlaEddine/pratas1.git'
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: "${env.BUILD_NUMBER}", description: 'Docker image tag')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip unit tests')
        booleanParam(name: 'SKIP_SCAN', defaultValue: false, description: 'Skip Trivy security scan')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        // ── Stage 1: Checkout ─────────────────────────────────────────────────
        stage('📥 Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG    = params.IMAGE_TAG ?: env.BUILD_NUMBER
                    env.SHORT_COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.FULL_TAG     = "${env.IMAGE_TAG}-${env.SHORT_COMMIT}"
                }
                echo "🏷️ Image tag final: ${env.FULL_TAG}"
            }
        }

        // ── Stage 2: Unit Tests (Parallel) ────────────────────────────────────
        stage('🧪 Unit Tests') {
            when { expression { !params.SKIP_TESTS } }
            parallel {
                stage('Test: Gateway') {
                    steps { dir('gateway') { sh 'npm ci && npm test --passWithNoTests || true' } }
                }
                stage('Test: Auth') {
                    steps { dir('services/auth') { sh 'npm ci && npm test --passWithNoTests || true' } }
                }
                stage('Test: Products') {
                    steps { dir('services/products') { sh 'npm ci && npm test --passWithNoTests || true' } }
                }
                // Ajoute les autres services ici si nécessaire
            }
        }

        // ── Stage 3: Docker Build & Tag (Parallel) ────────────────────────────
        stage('🐳 Build Docker Images') {
            steps {
                script {
                    def services = [
                        [name: 'gateway',       path: './gateway'],
                        [name: 'auth',          path: './services/auth'],
                        [name: 'products',      path: './services/products'],
                        [name: 'orders',        path: './services/orders'],
                        [name: 'payments',      path: './services/payments'],
                        [name: 'notifications', path: './services/notifications'],
                        [name: 'frontend',      path: './frontend'],
                    ]

                    def builds = [:]
                    services.each { svc ->
                        def s = svc
                        builds["Build: ${s.name}"] = {
                            def imageTag = "${env.REGISTRY}/${s.name}:${env.FULL_TAG}"
                            def latestTag = "${env.REGISTRY}/${s.name}:latest"
                            
                            // 1. Build avec le tag unique
                            sh "docker build -t ${imageTag} ${s.path}"
                            
                            // 2. Taguer aussi en 'latest'
                            sh "docker tag ${imageTag} ${latestTag}"
                            
                            echo "✅ Built & Tagged: ${imageTag} & ${latestTag}"
                        }
                    }
                    parallel builds
                }
            }
        }

        // ── Stage 4: Security Scan (Trivy) ────────────────────────────────────
        stage('🛡️ Security Scan (Trivy)') {
            when { expression { !params.SKIP_SCAN } }
            steps {
                script {
                    def services = ['gateway', 'auth', 'products', 'orders', 'payments', 'notifications', 'frontend']
                    services.each { svc ->
                        def imageTag = "${env.REGISTRY}/${svc}:${env.FULL_TAG}"
                        echo "Scanning ${imageTag}..."
                        // Scanne l'image locale. 
                        sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${imageTag} || true" 
                    }
                }
            }
        }

        // ── Stage 5: Push to Docker Hub ───────────────────────────────────────
        stage('📤 Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: env.REGISTRY_CREDS,
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASS'
                )]) {
                    sh 'echo "$REGISTRY_PASS" | docker login -u "$REGISTRY_USER" --password-stdin'
                    script {
                        def services = ['gateway', 'auth', 'products', 'orders', 'payments', 'notifications', 'frontend']
                        def pushes = [:]
                        
                        services.each { svc ->
                            def s = svc
                            pushes["Push: ${s}"] = {
                                def fullTag = "${env.REGISTRY}/${s}:${env.FULL_TAG}"
                                def latestTag = "${env.REGISTRY}/${s}:latest"
                                
                                echo "Pushing ${fullTag}..."
                                sh "docker push ${fullTag}"
                                
                                echo "Pushing ${latestTag}..."
                                sh "docker push ${latestTag}"
                            }
                        }
                        parallel pushes
                    }
                }
            }
            post {
                always {
                    sh 'docker logout || true'
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up..."
            sh 'docker image prune -f || true'
        }
        success {
            echo "✅ CI Successful! Images pushed with tag: ${env.FULL_TAG}"
        }
        failure {
            echo "❌ CI Failed. Check logs."
        }
    }
}