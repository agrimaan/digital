FROM rabbitmq:3.11-management

# Copy configuration files
COPY config/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
COPY config/definitions.json /etc/rabbitmq/definitions.json

# Enable plugins
RUN rabbitmq-plugins enable --offline rabbitmq_management rabbitmq_prometheus rabbitmq_shovel rabbitmq_shovel_management

# Expose ports
# - 5672: AMQP
# - 15672: Management UI
# - 15692: Prometheus metrics
EXPOSE 5672 15672 15692

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD rabbitmq-diagnostics -q ping || exit 1