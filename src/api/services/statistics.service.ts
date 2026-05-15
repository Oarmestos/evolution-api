import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';

export class StatisticsService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('StatisticsService');

  /**
   * Obtiene un resumen de estadísticas para una instancia específica o global si no se provee instanceId
   */
  public async getSummary(instanceId?: string) {
    try {
      const where = instanceId ? { instanceId } : {};

      const [totalMessages, totalSales, totalLeads, activeInstances] = await Promise.all([
        this.prisma.message.count({ where }),
        this.prisma.order.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { total: true },
        }),
        this.prisma.lead.count({ where }),
        this.prisma.instance.count({
          where: instanceId ? { id: instanceId } : {},
        }),
      ]);

      return {
        totalMessages,
        totalSales: totalSales._sum.total || 0,
        totalLeads,
        activeInstances,
        period: 'month', // Placeholder for future time-based filtering
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message || error}`);
      return {
        totalMessages: 0,
        totalSales: 0,
        totalLeads: 0,
        activeInstances: 0,
        error: true,
      };
    }
  }
}
