import { getObjectUrl, uploadTempFile } from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { ProductDto } from '@dto/product.dto';
import { BadRequestException, NotFoundException } from '@exceptions';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export class ProductService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('ProductService');

  public async create(instanceId: string, data: ProductDto) {
    return this.prisma.product.create({
      data: {
        ...data,
        instanceId,
      },
    });
  }

  public async findMany(instanceId: string) {
    return this.prisma.product.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findUnique(instanceId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, instanceId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  public async update(instanceId: string, id: string, data: Partial<ProductDto>) {
    await this.findUnique(instanceId, id);
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  public async delete(instanceId: string, id: string) {
    await this.findUnique(instanceId, id);
    return this.prisma.product.delete({
      where: { id },
    });
  }

  public async uploadProductImage(instanceId: string, file: Express.Multer.File) {
    try {
      const fileName = `product-${instanceId}-${uuidv4()}-${file.originalname}`;
      const folder = 'product-images';

      await uploadTempFile(folder, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype });

      const imageUrl = await getObjectUrl(`${folder}/${fileName}`);

      return { imageUrl };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al subir la imagen del producto');
    }
  }

  public async importProducts(instanceId: string, file: Express.Multer.File) {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('No se proporcionó ningún archivo o el archivo está vacío');
      }

      this.logger.info(`Iniciando importación masiva para instancia: ${instanceId}`);

      // Intentar detectar codificación para CSV
      let workbook;
      const isCsv = file.originalname.toLowerCase().endsWith('.csv');
      
      if (isCsv) {
        // Para CSVs, intentamos leer como UTF-8 primero
        const content = file.buffer.toString('utf8');
        // Si contiene el patrón de error común de Latin-1 (Ã¡, Ã©, etc), usamos codepage 1252
        if (content.includes('Ã') && (content.includes('¡') || content.includes('©') || content.includes('³'))) {
          workbook = XLSX.read(file.buffer, { type: 'buffer', codepage: 1252 });
        } else {
          workbook = XLSX.read(file.buffer, { type: 'buffer' });
        }
      } else {
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        updated: 0,
        errors: 0,
        details: [] as string[],
      };

      for (const row of data as any[]) {
        try {
          // Soporte para encabezados en Español e Inglés (Case Insensitive)
          const findKey = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              const found = rowKeys.find(rk => rk.toLowerCase() === k.toLowerCase());
              if (found) return row[found];
            }
            return undefined;
          };

          const name = findKey(['nombre', 'name', 'product', 'producto']);
          const priceStr = findKey(['precio', 'price', 'valor']);
          const sku = findKey(['sku', 'referencia', 'ref', 'code', 'codigo']);
          const stockVal = findKey(['stock', 'cantidad', 'quantity', 'unidades']);
          const imageVal = findKey(['url_imagen', 'imageurl', 'imagen', 'image', 'url', 'foto']);
          const descVal = findKey(['descripcion', 'description', 'detalle', 'detalles']);
          const catVal = findKey(['categoria', 'category', 'tipo', 'group', 'grupo']);
          
          if (!name || !priceStr) {
            results.errors++;
            results.details.push(`Fila inválida: Nombre o Precio faltante`);
            continue;
          }

          const price = parseFloat(String(priceStr).replace(/[^\d.,]/g, '').replace(',', '.'));
          if (isNaN(price)) {
            results.errors++;
            results.details.push(`Fila inválida: Precio "${priceStr}" no es numérico`);
            continue;
          }

          const productData = {
            name: String(name).trim(),
            price,
            sku: sku ? String(sku).trim() : '',
            category: catVal ? String(catVal).trim() : '',
            stock: parseInt(String(stockVal || '0')) || 0,
            description: descVal ? String(descVal).trim() : '',
            imageUrl: imageVal ? String(imageVal).trim() : '',
            enabled: true,
          };

          // Lógica de Upsert manual
          let existing = null;
          if (productData.sku) {
            existing = await this.prisma.product.findFirst({
              where: { instanceId, sku: productData.sku },
            });
          }

          if (existing) {
            await this.prisma.product.update({
              where: { id: existing.id },
              data: productData,
            });
            results.updated++;
          } else {
            await this.prisma.product.create({
              data: { ...productData, instanceId },
            });
            results.success++;
          }
        } catch (err) {
          results.errors++;
          results.details.push(`Error en fila: ${err.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al procesar el archivo de productos. Asegúrese de que sea un formato válido (.xlsx o .csv)');
    }
  }
}
