import { Resource } from "../types/resource";

export class ResourceService {
  private resources: Resource[];

  constructor(initialResources: Resource[]) {
    this.resources = initialResources;
  }

  addResource(resource: Resource) {
    this.resources.push(resource);
    return this.resources;
  }

  updateResource(updatedResource: Resource) {
    const index = this.resources.findIndex((r) => r.id === updatedResource.id);
    if (index !== -1) {
      this.resources[index] = { ...this.resources[index], ...updatedResource };
    }
    return this.resources;
  }

  removeResource(id: string) {
    this.resources = this.resources.filter((r) => r.id !== id);
    return this.resources;
  }

  getResources() {
    return [...this.resources];
  }
}
