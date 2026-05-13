import { ThemeService } from '../src/api/services/theme.service';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { waMonitor } from '../src/api/server.module';
import { uploadTempFile, getObjectUrl } from '../src/api/integrations/storage/s3/libs/minio.server';
import { NotFoundException } from '../src/exceptions';

// Mocks
vi.mock('../src/api/server.module', () => ({
  waMonitor: {
    waInstances: {},
  },
}));

vi.mock('../src/api/integrations/storage/s3/libs/minio.server', () => ({
  uploadTempFile: vi.fn(),
  getObjectUrl: vi.fn(),
}));

function makePrismaMock() {
  return {
    instance: {
      findUnique: vi.fn(),
    },
    storeTheme: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe('ThemeService', () => {
  let prisma: any;
  let service: ThemeService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ThemeService(prisma as any);
    vi.clearAllMocks();
  });

  describe('getTheme', () => {
    it('should return existing theme', async () => {
      const mockTheme = { id: 'theme-1', instanceId: 'inst-1', template: 'moderno' };
      prisma.storeTheme.findUnique.mockResolvedValue(mockTheme);

      const result = await service.getTheme('inst-1');

      expect(prisma.storeTheme.findUnique).toHaveBeenCalledWith({ where: { instanceId: 'inst-1' } });
      expect(result).toEqual(mockTheme);
    });

    it('should create and return new theme if not exists', async () => {
      prisma.storeTheme.findUnique.mockResolvedValue(null);
      prisma.storeTheme.create.mockResolvedValue({ id: 'new-theme', instanceId: 'inst-1' });

      const result = await service.getTheme('inst-1');

      expect(prisma.storeTheme.create).toHaveBeenCalledWith({ data: { instanceId: 'inst-1' } });
      expect(result.id).toBe('new-theme');
    });
  });

  describe('updateTheme', () => {
    it('should update theme and NOT sync with WhatsApp if syncWhatsapp is false', async () => {
      const data = { storeName: 'New Store', syncWhatsapp: false };
      prisma.storeTheme.upsert.mockResolvedValue({ ...data, instanceId: 'inst-1' });

      await service.updateTheme('inst-1', data as any);

      expect(prisma.storeTheme.upsert).toHaveBeenCalled();
      expect(prisma.instance.findUnique).not.toHaveBeenCalled();
    });

    it('should update theme and sync with WhatsApp if syncWhatsapp is true', async () => {
      const data = { storeName: 'New Store', syncWhatsapp: true, logoUrl: 'http://logo.com' };
      prisma.storeTheme.upsert.mockResolvedValue({ ...data, instanceId: 'inst-1' });
      prisma.instance.findUnique.mockResolvedValue({ id: 'inst-1', name: 'my-instance' });

      const waInstanceMock = {
        updateProfileName: vi.fn(),
        updateProfilePicture: vi.fn(),
      };
      (waMonitor as any).waInstances['my-instance'] = waInstanceMock;

      await service.updateTheme('inst-1', data as any);

      expect(prisma.instance.findUnique).toHaveBeenCalledWith({ where: { id: 'inst-1' } });
      expect(waInstanceMock.updateProfileName).toHaveBeenCalledWith('New Store');
      expect(waInstanceMock.updateProfilePicture).toHaveBeenCalledWith('http://logo.com');
    });
  });

  describe('getThemeByInstance', () => {
    it('should return theme, products and pagination data', async () => {
      prisma.instance.findUnique.mockResolvedValue({ id: 'inst-1', name: 'my-instance' });
      prisma.storeTheme.findUnique.mockResolvedValue({ id: 'theme-1' });
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      prisma.product.count.mockResolvedValue(10);

      const result = await service.getThemeByInstance('my-instance', 1, 2);

      expect(result.theme.id).toBe('theme-1');
      expect(result.products).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
      });
    });

    it('should throw NotFoundException if instance does not exist', async () => {
      prisma.instance.findUnique.mockResolvedValue(null);

      await expect(service.getThemeByInstance('unknown')).rejects.toThrow(/Instancia no encontrada|Error al obtener la tienda/);
    });
  });
});
