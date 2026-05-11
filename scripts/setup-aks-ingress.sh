#!/bin/bash

# Configuration
NAMESPACE="ingress-nginx"

echo "================================================================="
echo "🚀 Installation du NGINX Ingress Controller sur AKS..."
echo "================================================================="

# Ajouter le repo Helm ingress-nginx
echo "1️⃣ Ajout du repository Helm ingress-nginx..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Installer NGINX Ingress Controller
echo "2️⃣ Installation via Helm dans le namespace '$NAMESPACE'..."
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace $NAMESPACE \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz \
  --wait

echo ""
echo "================================================================="
echo "✅ Installation terminée !"
echo "================================================================="
echo "3️⃣ Récupération de l'adresse IP Publique (External IP)..."
echo "Veuillez patienter pendant que Azure attribue une adresse IP publique à votre Load Balancer..."

# Boucle pour attendre que l'IP externe soit attribuée
EXTERNAL_IP=""
while [ -z $EXTERNAL_IP ]; do
  sleep 5
  EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
done

echo ""
echo "🎉 L'IP publique de votre cluster AKS est : $EXTERNAL_IP"
echo "👉 Prochaine étape : Allez sur Cloudflare et créez un enregistrement de type 'A'."
echo "   - Nom : @ (ou la racine de votre domaine, ex: quickdeal.me)"
echo "   - Cible (IPv4) : $EXTERNAL_IP"
echo "   - Proxy status : 'DNS only' (recommandé pour commencer) ou 'Proxied'"
echo "================================================================="
