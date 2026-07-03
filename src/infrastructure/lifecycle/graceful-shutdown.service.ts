import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { DataSource } from 'typeorm';
import { Connection } from 'mongoose';

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectConnection()
    private readonly mongoConnection: Connection,
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Shutdown signal received: ${signal ?? 'unknown'}`);

    await this.closeSqlConnection();
    await this.closeMongoConnection();
    await this.closeRedisIfPresent();
    await this.closeRabbitMqIfPresent();
  }

  private async closeSqlConnection(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    try {
      await this.dataSource.destroy();
      this.logger.log('SQL Server connection closed');
    } catch (error) {
      this.logger.error(`Failed to close SQL Server connection: ${this.getErrorMessage(error)}`);
    }
  }

  private async closeMongoConnection(): Promise<void> {
    if (this.mongoConnection.readyState === 0) {
      return;
    }

    try {
      await this.mongoConnection.close();
      this.logger.log('MongoDB connection closed');
    } catch (error) {
      this.logger.error(`Failed to close MongoDB connection: ${this.getErrorMessage(error)}`);
    }
  }

  private async closeRedisIfPresent(): Promise<void> {
    const maybeRedis = (globalThis as Record<string, unknown>).__aivacolRedisClient;
    if (!maybeRedis || typeof maybeRedis !== 'object') {
      return;
    }

    const redisClient = maybeRedis as { quit?: () => Promise<unknown>; disconnect?: () => void };

    try {
      if (typeof redisClient.quit === 'function') {
        await redisClient.quit();
      } else if (typeof redisClient.disconnect === 'function') {
        redisClient.disconnect();
      }

      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error(`Failed to close Redis connection: ${this.getErrorMessage(error)}`);
    }
  }

  private async closeRabbitMqIfPresent(): Promise<void> {
    const maybeRabbit = (globalThis as Record<string, unknown>).__aivacolRabbitConnection;
    if (!maybeRabbit || typeof maybeRabbit !== 'object') {
      return;
    }

    const rabbitConnection = maybeRabbit as { close?: () => Promise<unknown> };

    try {
      if (typeof rabbitConnection.close === 'function') {
        await rabbitConnection.close();
        this.logger.log('RabbitMQ connection closed');
      }
    } catch (error) {
      this.logger.error(`Failed to close RabbitMQ connection: ${this.getErrorMessage(error)}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
