'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { AdminUserProvider } from '@/context/AdminUserContext';


const users = [
  { id: '10021', name: 'Alex Ray', booksIssued: 12, department: 'Psychology', rfid: 'RFID_A123' },
  { id: '12034', name: 'Sophia', booksIssued: 7, department: 'Business', rfid: 'RFID_B456' },
  { id: '22987', name: 'Jhon', booksIssued: 17, department: 'Computer Science', rfid: 'RFID_C789' },
  { id: '53272', name: 'Rose', booksIssued: 25, department: 'Pharmacy', rfid: 'RFID_D101' },
  { id: '10022', name: 'Liam Smith', booksIssued: 5, department: 'History', rfid: 'RFID_E112' },
  { id: '12035', name: 'Olivia Brown', booksIssued: 9, department: 'Marketing', rfid: 'RFID_F131' },
];

function MembersPageContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground">Manage library member information.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Member List</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search members..." className="pl-8" />
                    </div>
                    <Button><UserPlus className="mr-2 h-4 w-4" /> Add New Member</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Books Issued</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>RFID Card ID</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                    </TableCell>
                    <TableCell>{user.booksIssued}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.rfid}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function MembersPage() {
    return (
        <AdminUserProvider>
            <MembersPageContent />
        </AdminUserProvider>
    )
}
