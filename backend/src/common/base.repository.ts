import { EntityRepository } from '@mikro-orm/mysql';

export class BaseRepository<T extends object> extends EntityRepository<T> {
  persist(entity: T) {
    return this.getEntityManager().persist(entity);
  }

  async flush() {
    return this.getEntityManager().flush();
  }

  async persistAndFlush(entity: T) {
    this.persist(entity);
    await this.flush();
  }

  async remove(entity: T) {
    return this.getEntityManager().remove(entity);
  }

  async removeAndFlush(entity: T) {
    this.remove(entity);
    await this.flush();
  }
}
