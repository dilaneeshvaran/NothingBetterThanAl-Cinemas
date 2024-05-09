import {DataSource} from "typeorm";
import { User } from "../database/entities/user";
import bcrypt from 'bcrypt';

export interface ListUser {
    limit: number;
    page: number;
}

export interface UpdateUserParams {
    id: number;
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'client';
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
        const query = this.db.createQueryBuilder(User, "users");
      
        query.where("users.id = :id", { id: userId });
      
        const user = await query.getOne();
      
        if (!user) {
            throw new Error('User not found');
        }
      
        return user;
    }

    async getUserByEmail(email: string): Promise<User> {
        const query = this.db.createQueryBuilder(User, "users");
      
        query.where("users.email = :email", { email });
      
        const user = await query.getOne();
      
        if (!user) {
            throw new Error('User not found');
        }
      
        return user;
    }

    async updateUser(
        id: number,
        { name, email, password, role, balance }: UpdateUserParams
    ): Promise<User | null> {
        const repo = this.db.getRepository(User);
        const userFound = await repo.findOneBy({ id });
        if (userFound === null) return null;
    
        if (name) {
            userFound.name = name;
        }
        if (email) {
            userFound.email = email;
        }  
        if (password) {
            userFound.password = await this.hashPassword(password);
        }
        if (role) {
            userFound.role = role;
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

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }
    
    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    }
    
}