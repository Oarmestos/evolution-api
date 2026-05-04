type Constructor<T = any> = new (...args: any[]) => T;

interface RegistryEntry {
  token: string | Constructor;
  instance?: any;
  factory: (...args: any[]) => any;
  dependencies?: (string | Constructor)[];
}

class ModuleRegistry {
  private static instance: ModuleRegistry;
  private entries: Map<string | Constructor, RegistryEntry> = new Map();

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  register<T>(
    token: string | Constructor<T>,
    factory: (...args: any[]) => T,
    dependencies: (string | Constructor)[] = [],
  ): void {
    this.entries.set(token, { token, factory, dependencies });
  }

  resolve<T>(token: string | Constructor<T>): T {
    const entry = this.entries.get(token);
    if (!entry) {
      throw new Error(`No provider found for ${typeof token === 'string' ? token : token.name}`);
    }

    if (entry.instance) {
      return entry.instance as T;
    }

    const deps = entry.dependencies.map((dep) => this.resolve(dep));
    entry.instance = entry.factory(...deps);
    return entry.instance as T;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const AppRegistry = ModuleRegistry.getInstance();
