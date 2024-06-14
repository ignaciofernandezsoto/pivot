#!/usr/bin/env groovy

def NEW_FULL_CONTAINER_NAME = ''

pipeline {
    agent any
    stages {
        stage('Create env file') {
            steps {
                sh 'touch .env'

                sh 'echo "APIPI_BASE_URL=${APIPI_BASE_URL}" >> .env'
                sh 'echo "WHITELISTED_TORRENT_USERS=${WHITELISTED_TORRENT_USERS}" >> .env'
                sh 'echo "WHITELISTED_MOVIE_USERS=${WHITELISTED_MOVIE_USERS}" >> .env'
                sh 'echo "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}" >> .env'
                sh 'echo "TRANSMISSION_USERNAME=${TRANSMISSION_USERNAME}" >> .env'
                sh 'echo "TRANSMISSION_PASSWORD=${TRANSMISSION_PASSWORD}" >> .env'
            }
        }
        stage('Create new container name') {
            steps {
                script {
                    def current_date = sh script:'date +%Y%m%d%H%H%S', returnStdout: true
                    def trimmed_current_date = current_date.trim()
                    def random_string = sh script:'openssl rand -hex 4', returnStdout: true
                    def trimmed_random_string = random_string.trim()
                    def new_full_container_name = sh script:'echo "${PIVOT_FULL_IMAGE_NAME}_' + trimmed_current_date + '_' + trimmed_random_string + '"', returnStdout: true
                    NEW_FULL_CONTAINER_NAME = new_full_container_name.trim()
                }
            }
        }
        stage('Build docker image') {
            steps {
                sh 'docker build -t ' + NEW_FULL_CONTAINER_NAME + ' .'
            }
        }
        stage('Stop and delete previous docker container') {
            steps {
                sh 'docker ps -a \
                  | awk \'{ print $1,$2 }\' \
                  | grep ${PIVOT_SHORT_IMAGE_NAME} \
                  | awk \'{print $1 }\' \
                  | xargs -I {} docker rm -f {}'
              }
        }
        stage('Run new docker container') {
            steps {
                sh 'docker run --network="host" --name ${PIVOT_SHORT_IMAGE_NAME} -d --restart unless-stopped ' + NEW_FULL_CONTAINER_NAME
            }
        }
    }
}