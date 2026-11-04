# Single-node Canton sandbox with the JSON Ledger API, plus the bond DAR pre-built.
# Avoids installing Java / dpm on the host.
FROM eclipse-temurin:17-jdk

# Optional extra root CAs (e.g. antivirus / corporate TLS-inspection proxy). Drop *.crt files in certs/.
COPY certs/ /usr/local/share/ca-certificates/
RUN update-ca-certificates

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && curl -sSL https://get.digitalasset.com/install/install.sh | sh
ENV PATH=/root/.dpm/bin:$PATH

WORKDIR /canton
COPY daml.yaml ./
RUN dpm install package
COPY daml ./daml
RUN dpm build && dpm test

EXPOSE 7575
CMD ["dpm", "sandbox", "--json-api-port", "7575", "--dar", ".daml/dist/tokenising-bond-0.1.0.dar", \
     "-C", "canton.participants.sandbox.http-ledger-api.address=0.0.0.0"]
