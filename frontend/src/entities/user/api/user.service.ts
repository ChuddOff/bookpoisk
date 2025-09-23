import { apiService, type ApiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import type { User } from "../model/types";

export class UserService {
  private readonly api: ApiService;
  constructor(api: ApiService = apiService) {
    this.api = api;
  }
  me() {
    return this.api.get<User>(ENDPOINT.user);
  }
}

export const userService = new UserService();
