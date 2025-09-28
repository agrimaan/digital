# RabbitMQ for Agrimaan Platform

This directory contains the RabbitMQ configuration for the Agrimaan microservices platform. RabbitMQ is used as the message broker for asynchronous communication between services.

## Overview

RabbitMQ provides the messaging infrastructure for:
- Event-driven communication between services
- Task queues for background processing
- Dead letter queues for handling failed messages

## Configuration

The RabbitMQ configuration includes:

- **rabbitmq.conf**: Main configuration file with settings for networking, security, and resource limits
- **definitions.json**: Predefined exchanges, queues, and bindings

## Predefined Resources

### Exchanges

- **agrimaan.events**: Topic exchange for event-driven communication
- **agrimaan.dlx**: Dead letter exchange for handling failed messages

### Queues

- **agrimaan.tasks**: Queue for background tasks
- **agrimaan.dlq**: Dead letter queue for failed messages

## Usage

### Docker Compose

```yaml
rabbitmq:
  build: ./rabbitmq
  container_name: agrimaan-rabbitmq
  restart: always
  ports:
    - "5672:5672"
    - "15672:15672"
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
  networks:
    - agrimaan-network
```

### Environment Variables

Services that need to connect to RabbitMQ should use the following environment variable:

```
RABBITMQ_URL=amqp://agrimaan:agrimaan123@rabbitmq:5672
```

## Management UI

The RabbitMQ Management UI is available at http://localhost:15672 with the following credentials:

- Username: agrimaan
- Password: agrimaan123

## Monitoring

RabbitMQ exposes Prometheus metrics at http://localhost:15692/metrics for monitoring.

## Best Practices

1. **Connection Management**: Use a connection pool to avoid creating too many connections
2. **Channel Management**: Reuse channels for better performance
3. **Acknowledgments**: Use manual acknowledgments for reliable message processing
4. **Prefetch Count**: Set an appropriate prefetch count to avoid overwhelming consumers
5. **Dead Letter Queues**: Configure queues with dead letter exchanges for handling failed messages
6. **Persistent Messages**: Use persistent messages for important data
7. **Durability**: Use durable exchanges and queues for data that should survive broker restarts
8. **Monitoring**: Monitor queue depths and processing rates