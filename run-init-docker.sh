# -d for demonised
sudo docker compose up --build -d
sudo docker exec -it backend-app-1 yarn db

sleep 1000

sudo docker compose down
