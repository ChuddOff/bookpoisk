import { ENDPOINT } from "@/shared/api/endpoints";
import type { User } from "@/entities/user";
import { httpAuth } from "@/shared/api/axios";

export class UserService {
  me() {
    return httpAuth.get<User>(ENDPOINT.user).then((res) => res.data);
  }
}

export const userService = new UserService();
