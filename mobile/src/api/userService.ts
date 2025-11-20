import { ENDPOINT } from "./endpoints";
import { http } from "./http";
import type { UserEntity } from "@/types/user";

export class UserService {
  async me() {
    const res = await http.get<UserEntity>(ENDPOINT.user);
    return res.data;
  }
}

export const userService = new UserService();
