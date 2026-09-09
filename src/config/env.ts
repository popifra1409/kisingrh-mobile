/**
 * ⚠️ IMPORTANT : "localhost" ne fonctionne PAS depuis un téléphone physique
 * ou un émulateur — il faut l'adresse IP LOCALE de votre machine de dev
 * sur le réseau Wi-Fi (ex: 192.168.1.42), pas "localhost" ni "127.0.0.1".
 *
 * Pour trouver votre IP locale :
 *   - Linux/Mac : ifconfig | grep "inet " (ou `ip a`)
 *   - Windows   : ipconfig (cherchez "Adresse IPv4")
 *
 * Le téléphone et l'ordinateur doivent être sur le MÊME réseau Wi-Fi/LAN.
 */
export const API_BASE_URL = 'http://192.168.43.180:8000/api';

export const API_TIMEOUT_MS = 15000;
