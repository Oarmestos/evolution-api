import { StatisticsService } from '@api/services/statistics.service';

export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  public async getSummary(instance: any) {
    // Si instance existe (pasado por el guard), obtenemos estadísticas de esa instancia
    // Si no, podríamos obtener estadísticas globales si el usuario es ADMIN (futuro)
    return this.statisticsService.getSummary(instance?.id);
  }
}
