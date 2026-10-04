#!/usr/bin/env bash
# Install the RWANIMU API on Ubuntu or Debian.
# Clone the repo, then run: sudo bash deployment/vps/install.sh
# Optional: sudo RWANIMU_DOMAIN=api.example.com bash deployment/vps/install.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deployment/vps/install.sh"
  exit 1
fi

if [[ ! -f /etc/debian_version ]]; then
  echo "This installer supports Ubuntu and Debian."
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR=$(cd "${SCRIPT_DIR}/../.." && pwd)
if [[ ! -f "${APP_DIR}/apps/api/src/main.ts" ]]; then
  echo "Run this script from a clone of the RWANIMU repository."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
PACKAGES=(ca-certificates curl gnupg postgresql postgresql-contrib)
if [[ ! -x /www/server/nginx/sbin/nginx ]]; then
  PACKAGES+=(nginx)
fi
apt-get install -y "${PACKAGES[@]}"

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

NODE_BIN=$(command -v node)
if [[ -z "${NODE_BIN}" ]]; then
  echo "Node.js was not installed."
  exit 1
fi

if ! id rwanimu >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/rwanimu --shell /usr/sbin/nologin rwanimu
fi

install -d -o rwanimu -g rwanimu -m 750 /var/backups/rwanimu/primary /var/backups/rwanimu/secondary
systemctl enable --now postgresql

cluster_line=$(pg_lsclusters --no-header | awk '$4=="online" {print; exit}')
if [[ -z "${cluster_line}" ]]; then
  echo "PostgreSQL did not start."
  pg_lsclusters || true
  exit 1
fi
PGVER=$(awk '{print $1}' <<<"${cluster_line}")
PGNAME=$(awk '{print $2}' <<<"${cluster_line}")
PGPORT=$(awk '{print $3}' <<<"${cluster_line}")

move_shop_database_port() {
  local candidate newport=""
  for candidate in 5433 5434 5435 5436 5437; do
    if [[ "${candidate}" == "${PGPORT}" ]]; then
      continue
    fi
    if ! ss -lnt "sport = :${candidate}" | awk 'NR>1 {found=1} END {exit !found}'; then
      newport="${candidate}"
      break
    fi
  done
  if [[ -z "${newport}" ]]; then
    echo "Port ${PGPORT} belongs to another database, and no free port was found."
    exit 1
  fi
  echo "Port ${PGPORT} belongs to another database. The shop database will use ${newport}."
  pg_conftool "${PGVER}" "${PGNAME}" set port "${newport}"
  systemctl restart postgresql
  PGPORT="${newport}"
}

tcp_msg=$(sudo -u postgres psql -w -h 127.0.0.1 -p "${PGPORT}" -c 'SELECT 1' 2>&1 || true)
if grep -Eq 'does not exist|Connection refused|could not connect' <<<"${tcp_msg}"; then
  move_shop_database_port
fi

ENV_FILE="${APP_DIR}/.env"
FRESH_ENV=0
if [[ ! -f "${ENV_FILE}" ]]; then
  FRESH_ENV=1
  DB_PASS=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 32)
  umask 077
  cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://rwanimu:${DB_PASS}@127.0.0.1:${PGPORT}/rwanimu_shop
JWT_SECRET=${JWT_SECRET}
DEFAULT_LANGUAGE=en
TZ=Africa/Kigali
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_GRAPH_VERSION=v23.0
SMS_API_URL=
SMS_API_KEY=
BACKUP_DIR=/var/backups/rwanimu/primary
BACKUP_SECOND_COPY_DIR=/var/backups/rwanimu/secondary
PG_DUMP_BIN=pg_dump
PG_RESTORE_BIN=pg_restore
EOF
  umask 022
fi
chown rwanimu:rwanimu "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

DB_PASS=$(printf '%s\n' "${DATABASE_URL}" | sed -E 's#postgresql://[^:]+:([^@]+)@.*#\1#')
if [[ -z "${DB_PASS}" || "${DB_PASS}" == "${DATABASE_URL}" || "${DB_PASS}" == *"'"* ]]; then
  echo "DATABASE_URL in ${ENV_FILE} must be postgresql://user:password@host/db with no single quote in the password."
  exit 1
fi

if [[ "${DATABASE_URL}" == postgresql://*@127.0.0.1:*/* || "${DATABASE_URL}" == postgresql://*@localhost:*/* ]]; then
  UPDATED_URL=$(printf '%s\n' "${DATABASE_URL}" | sed -E "s#@(127\\.0\\.0\\.1|localhost):[0-9]+/#@127.0.0.1:${PGPORT}/#")
  if [[ "${UPDATED_URL}" != "${DATABASE_URL}" ]]; then
    sed -i "s#^DATABASE_URL=.*#DATABASE_URL=${UPDATED_URL}#" "${ENV_FILE}"
    DATABASE_URL="${UPDATED_URL}"
  fi
fi

if sudo -u postgres psql -p "${PGPORT}" -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'rwanimu'" | grep -q 1; then
  sudo -u postgres psql -p "${PGPORT}" -v ON_ERROR_STOP=1 -c "ALTER ROLE rwanimu WITH LOGIN PASSWORD '${DB_PASS}'"
else
  sudo -u postgres psql -p "${PGPORT}" -v ON_ERROR_STOP=1 -c "CREATE ROLE rwanimu LOGIN PASSWORD '${DB_PASS}'"
fi

if ! sudo -u postgres psql -p "${PGPORT}" -tAc "SELECT 1 FROM pg_database WHERE datname = 'rwanimu_shop'" | grep -q 1; then
  sudo -u postgres createdb -p "${PGPORT}" --owner=rwanimu rwanimu_shop
fi
sudo -u postgres psql -p "${PGPORT}" -d rwanimu_shop -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO rwanimu;"

use_shop_database_port() {
  UPDATED_URL=$(printf '%s\n' "${DATABASE_URL}" | sed -E "s#@(127\\.0\\.0\\.1|localhost):[0-9]+/#@127.0.0.1:${PGPORT}/#")
  if [[ "${UPDATED_URL}" != "${DATABASE_URL}" ]]; then
    sed -i "s#^DATABASE_URL=.*#DATABASE_URL=${UPDATED_URL}#" "${ENV_FILE}"
    DATABASE_URL="${UPDATED_URL}"
  fi
}

login_msg=$(psql "${DATABASE_URL}" -tAc 'SELECT current_user' 2>&1 || true)
if [[ "$(printf '%s' "${login_msg}" | tr -d '[:space:]')" != "rwanimu" ]] && grep -Eq 'does not exist|Connection refused|could not connect' <<<"${login_msg}"; then
  move_shop_database_port
  use_shop_database_port
  login_msg=$(psql "${DATABASE_URL}" -tAc 'SELECT current_user' 2>&1 || true)
fi
if [[ "$(printf '%s' "${login_msg}" | tr -d '[:space:]')" != "rwanimu" ]]; then
  echo "Could not sign in to the shop database on 127.0.0.1:${PGPORT}."
  printf '%s\n' "${login_msg}" | sed -E 's#postgresql://[^@]+@#postgresql://rwanimu@#'
  pg_lsclusters || true
  ss -lnt | grep -E '543[0-9]' || true
  exit 1
fi

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

shopt -s nullglob
for migration in "${APP_DIR}"/database/migrations/*.sql; do
  filename=$(basename "${migration}")
  applied=$(psql "${DATABASE_URL}" -tAc "SELECT 1 FROM schema_migrations WHERE filename = '${filename}'")
  if [[ "${applied}" != "1" ]]; then
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${migration}"
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations(filename) VALUES ('${filename}')"
  fi
done
shopt -u nullglob

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${APP_DIR}/database/seeds/001_locations.sql"

chown -R rwanimu:rwanimu "${APP_DIR}"
install -d -o rwanimu -g rwanimu /var/lib/rwanimu/npm-cache
(
  cd "${APP_DIR}"
  sudo -u rwanimu env HOME=/var/lib/rwanimu npm_config_cache=/var/lib/rwanimu/npm-cache -u NODE_ENV npm install
  sudo -u rwanimu env HOME=/var/lib/rwanimu npm_config_cache=/var/lib/rwanimu/npm-cache -u NODE_ENV npm run build --workspace @rwanimu/api
)

ADMIN_READY=$(psql "${DATABASE_URL}" -tAc "SELECT 1 FROM users WHERE username = 'admin'")
ADMIN_PASSWORD=""
if [[ "${ADMIN_READY}" != "1" ]]; then
  ADMIN_PASSWORD=$(openssl rand -hex 12)
  (
    cd "${APP_DIR}"
    sudo -u rwanimu env HOME=/var/lib/rwanimu npm_config_cache=/var/lib/rwanimu/npm-cache \
      DATABASE_URL="${DATABASE_URL}" DEV_ADMIN_USERNAME=admin DEV_ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
      npm run seed:dev-admin
  )
  umask 077
  cat > /root/rwanimu-first-login.txt <<EOF
username: admin
password: ${ADMIN_PASSWORD}
Change this password after the first sign-in, then delete this file.
EOF
  umask 022
  chmod 600 /root/rwanimu-first-login.txt
fi

UNIT_PATH=/etc/systemd/system/rwanimu-api.service
sed \
  -e "s#/opt/rwanimu#${APP_DIR}#g" \
  -e "s#/usr/bin/node#${NODE_BIN}#g" \
  "${SCRIPT_DIR}/rwanimu-api.service" > "${UNIT_PATH}"
systemctl daemon-reload
systemctl enable --now rwanimu-api
systemctl restart rwanimu-api

SERVER_NAME="${RWANIMU_DOMAIN:-}"
if [[ -z "${SERVER_NAME}" ]]; then
  SERVER_NAME=$(curl -4 -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')
fi
PROXY_CONF=$(cat <<EOF
server {
  listen 80;
  server_name ${SERVER_NAME};
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
)
if [[ -x /www/server/nginx/sbin/nginx ]]; then
  if [[ -d /www/server/panel/vhost/nginx ]]; then
    VHOST_DIR=/www/server/panel/vhost/nginx
  else
    VHOST_DIR=/www/server/nginx/conf/vhost
    install -d "${VHOST_DIR}"
  fi
  printf '%s\n' "${PROXY_CONF}" > "${VHOST_DIR}/rwanimu-api.conf"
  /www/server/nginx/sbin/nginx -t
  /www/server/nginx/sbin/nginx -s reload
else
  printf '%s\n' "${PROXY_CONF}" > /etc/nginx/sites-available/rwanimu-api
  ln -sfn /etc/nginx/sites-available/rwanimu-api /etc/nginx/sites-enabled/rwanimu-api
  nginx -t
  systemctl enable nginx
  systemctl reload nginx
fi

CRON_FILE=/etc/cron.d/rwanimu-backup
cat > "${CRON_FILE}" <<EOF
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * rwanimu . ${APP_DIR}/.env; ${APP_DIR}/deployment/scripts/daily-backup.sh
EOF
chmod 644 "${CRON_FILE}"

if [[ ! -d /www/server/panel ]] && command -v ufw >/dev/null 2>&1 && ufw status | grep -q 'Status: active'; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

ok=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null; then
    ok=1
    break
  fi
  sleep 1
done

if [[ "${ok}" -ne 1 ]]; then
  echo "The API did not answer /api/health."
  journalctl -u rwanimu-api -n 60 --no-pager || true
  exit 1
fi

echo
echo "RWANIMU API is running."
echo "Health: http://127.0.0.1:3000/api/health"
echo "Public URL: http://${SERVER_NAME}/api"
if [[ -n "${ADMIN_PASSWORD}" ]]; then
  echo "Admin username: admin"
  echo "Admin password: ${ADMIN_PASSWORD}"
  echo "A copy is in /root/rwanimu-first-login.txt. Change the password, then delete that file."
else
  echo "The admin user already exists. The password was not changed."
fi
if [[ "${FRESH_ENV}" -eq 1 ]]; then
  echo "Database and JWT secrets are in ${ENV_FILE}."
fi
