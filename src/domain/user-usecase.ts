import {DataSource} from "typeorm";
import { User } from "../database/entities/user";

export interface ListUser {
    limit: number;
    page: number;
}

export interface UpdateUserParams {
    id: number;
    name?: string;
    password?: string;
    role?: 'admin' | 'client';
    token?: string;
    balance?: number;
  }

export class UserUsecase {
    constructor(private readonly db: DataSource) {}

    async listUser(
        listUser: ListUser
    ): Promise<{ users: User[]; totalCount: number }> {
        const query = this.db.createQueryBuilder(User, "users");
        
        query.skip((listUser.page - 1) * listUser.limit);
        query.take(listUser.limit);
    
        const [users, totalCount] = await query.getManyAndCount();
        return {
            users,
            totalCount,
        };
    }

    async getUserById(userId: number): Promise<User> {
        const userQuery = this.db.createQueryBuilder(User, "users");
        userQuery.where("users.id = :id", { id: userId });
      
        const user = await userQuery.getOne();
      
        if (!user) {
            throw new Error('User not found');
        }
      
        return user;
    }

    async updateUser(
        id: number,
        { name, password, role, token, balance }: UpdateUserParams
    ): Promise<User | null> {
        const repo = this.db.getRepository(User);
        const userFound = await repo.findOneBy({ id });
        if (userFound === null) return null;

        if (name) {
            userFound.name = name;
        }  
        if (password) {
            userFound.password = password;
        }
        if (role) {
            userFound.role = role;
        }
        if (token) {
            userFound.token = token;
        }
        if (balance) {
            userFound.balance = balance;
        }
        const userUpdate = await repo.save(userFound);
        return userUpdate;
    }

    async deleteUser(id: number): Promise<User | null> {
        const repo = this.db.getRepository(User);
        const userFound = await repo.findOneBy({ id });
    
        if (!userFound) return null;
    
        await repo.remove(userFound);
        return userFound;
    }

   
    async invalidateUserToken(id: number): Promise<User> {
        const repo = this.db.getRepository(User);
        const userFound = await repo.findOne({ where: { id } });
    
        if (!userFound) {
            throw new Error(`User with id ${id} not found`);
        }
    
        userFound.token = '';
    
        await repo.save(userFound);
        return userFound;
    }
}