# Agrimaan Integration Scripts

This directory contains scripts for integrating the core components of the Agrimaan microservices architecture with individual services.

## Available Scripts

### `integrate-all-components.sh`

Master script that runs all three integration scripts in sequence.

```bash
./integrate-all-components.sh
```

### `integrate-service-discovery.sh`

Integrates Consul service discovery with all microservices.

```bash
./integrate-service-discovery.sh
```

### `integrate-circuit-breaker.sh`

Integrates circuit breaker pattern with all microservices.

```bash
./integrate-circuit-breaker.sh
```

### `integrate-message-queue.sh`

Integrates RabbitMQ message queue with all microservices.

```bash
./integrate-message-queue.sh
```

## Usage

1. Make sure all scripts are executable:
   ```bash
   chmod +x *.sh
   ```

2. Run the master script to integrate all components:
   ```bash
   ./integrate-all-components.sh
   ```

3. After integration, follow the post-integration steps in the [Integration Guide](../docs/integration-guide.md).

## What These Scripts Do

- Update service configuration files
- Add required dependencies to package.json
- Create necessary directories and files
- Modify server.js to initialize components
- Set up event publishers and subscribers
- Configure service clients with circuit breaker

For detailed information about what each script does, refer to the [Integration Guide](../docs/integration-guide.md).