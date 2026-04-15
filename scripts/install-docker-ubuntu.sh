#!/usr/bin/env bash

set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
  echo "Run this script with sudo, for example: sudo ./scripts/install-docker-ubuntu.sh" >&2
  exit 1
fi

if [ ! -f /etc/os-release ]; then
  echo "This script expects /etc/os-release to exist." >&2
  exit 1
fi

. /etc/os-release

if [ "${ID:-}" != "ubuntu" ]; then
  echo "This installer is intended for Ubuntu. Detected ID=${ID:-unknown}." >&2
  exit 1
fi

echo "Installing Docker Engine from Docker's official Ubuntu repository..."

apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-${VERSION_CODENAME}}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

target_user="${SUDO_USER:-}"
if [ -n "$target_user" ] && id "$target_user" >/dev/null 2>&1; then
  if ! getent group docker >/dev/null 2>&1; then
    groupadd docker
  fi

  usermod -aG docker "$target_user"
  echo "Added $target_user to the docker group."
fi

echo
echo "Docker installation complete."
echo "Verify with: sudo docker run hello-world"
echo "If you were added to the docker group, log out and back in before running docker without sudo."
