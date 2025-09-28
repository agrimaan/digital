# Consul Server for Agrimaan Platform

This directory contains the configuration for the Consul server used for service discovery in the Agrimaan microservices platform.

## Overview

Consul provides service discovery, health checking, and a distributed key-value store for the Agrimaan microservices. It allows services to register themselves and discover other services dynamically, eliminating the need for hardcoded service URLs.

## Features

- **Service Registration**: Services register themselves with Consul on startup
- **Service Discovery**: Services query Consul to find other services
- **Health Checking**: Consul monitors service health through HTTP endpoints
- **UI Dashboard**: Web interface for monitoring services and their health

## Configuration

The Consul server is configured with the following settings:

- Server mode enabled
- Single server deployment (bootstrap_expect: 1)
- UI enabled and accessible at http://localhost:8500
- Data stored in a persistent volume

## Ports

- **8500**: HTTP API and UI
- **8600**: DNS interface

## Usage

### Accessing the UI

The Consul UI is accessible at http://localhost:8500 when the container is running.

### Service Registration

Services should register with Consul on startup using the service registration module. See the service-registry.js module in the shared utilities for implementation details.

### Service Discovery

Services can discover other services using the service discovery client. See the service-discovery.js module in the shared utilities for implementation details.

## Integration with Agrimaan Services

Each Agrimaan microservice should:

1. Register with Consul on startup
2. Use the service discovery client to find other services
3. Implement a health check endpoint at /health
4. Deregister from Consul on shutdown