<?php
/**
 * GitHub Webhook Deployment Script
 * 
 * Ovaj fajl treba postaviti na vaš server (npr. https://dnevnik.tsp.edu.rs/deploy.php)
 * Zatim na GitHub-u kao Payload URL unesite tačnu putanju do ovog fajla.
 */

// 1. PODEŠAVANJA
// Unesite tajni ključ koji ste uneli u polje "Secret" na GitHub-u (možete izmisliti bilo koji string)
$secret = 'vas_tajni_kljuc_12345'; 

// Putanja do foldera gde se nalazi vaš projekat (mora biti apsolutna putanja ili relativna u odnosu na deploy.php)
$repo_dir = '/var/www/html/maticneknjige'; 

// Komanda koja će se izvršiti
// Za React/Vite aplikaciju ovo povlači kod i bilduje ga.
$deploy_command = 'cd ' . escapeshellarg($repo_dir) . ' && git pull origin master && npm install && npm run build 2>&1';

// Log fajl gde će se upisivati rezultati deploy-a
$log_file = 'deploy.log';

// 2. SIGURNOSNE PROVERE
$headers = getallheaders();
// U zavisnosti od servera, nekada se hederi zovu drugačije, ali obično je HTTP_X_HUB_SIGNATURE_256
$hub_signature = isset($_SERVER['HTTP_X_HUB_SIGNATURE_256']) ? $_SERVER['HTTP_X_HUB_SIGNATURE_256'] : (isset($headers['X-Hub-Signature-256']) ? $headers['X-Hub-Signature-256'] : '');

// Uzimanje tela zahteva
$payload = file_get_contents('php://input');

// Ako ste postavili Secret na GitHub-u, proveravamo da li se poklapa
if ($secret !== '') {
    $hash = 'sha256=' . hash_hmac('sha256', $payload, $secret, false);
    if (!hash_equals($hash, $hub_signature)) {
        http_response_code(403);
        die("Greška: Neispravan Secret ključ. Očekivano: $hash Dobijeno: $hub_signature");
    }
}

// 3. IZVRŠAVANJE KOMANDE
// Koristimo shell_exec za izvršavanje bash komande
$output = shell_exec($deploy_command);

// 4. LOGOVANJE REZULTATA
$log_entry = "========================================================================\n";
$log_entry .= "Datum: " . date('Y-m-d H:i:s') . "\n";
$log_entry .= "Izlaz:\n" . $output . "\n\n";

file_put_contents($log_file, $log_entry, FILE_APPEND);

echo "Deploy je uspešno pokrenut!";
?>
