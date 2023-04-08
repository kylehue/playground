export interface User {
   id: string;
   ip: string;
   name: string;
}

export interface Room {
   id: string;
   users: User[];
}
