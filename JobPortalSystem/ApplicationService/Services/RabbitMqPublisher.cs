using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace ApplicationService.Services;

public class RabbitMqPublisher(IConfiguration config, ILogger<RabbitMqPublisher> logger) : IRabbitMqPublisher, IDisposable
{
    private IConnection? _connection;
    private IModel? _channel;
    private const string ExchangeName = "application-events";

    private void EnsureConnected()
    {
        if (_channel != null && _channel.IsOpen) return;

        var factory = new ConnectionFactory
        {
            HostName = config["RabbitMQ:Host"] ?? "localhost",
            UserName = config["RabbitMQ:Username"] ?? "guest",
            Password = config["RabbitMQ:Password"] ?? "guest"
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare(ExchangeName, ExchangeType.Fanout, durable: true);
    }

    public Task PublishStatusChangedAsync(ApplicationStatusChangedEvent evt)
    {
        try
        {
            EnsureConnected();
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(evt));
            _channel!.BasicPublish(ExchangeName, routingKey: string.Empty, body: body);
            logger.LogInformation("Published ApplicationStatusChanged for {ApplicationId}", evt.ApplicationId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish RabbitMQ event for application {ApplicationId} — swallowing", evt.ApplicationId);
        }
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
