
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ClientThemeSwitcher } from '@/components/ClientThemeSwitcher';
import { AdminUserProvider, useAdminUser } from '@/context/AdminUserContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useStorage, useUser } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { User as FirebaseAuthUser } from 'firebase/auth';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

// A helper component to ensure auth is loaded before rendering the uploader
function ProfileSettings() {
  const { user: authUser, loading: authLoading } = useUser();
  
  if (authLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Update your display name and profile picture.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Loading profile...</p>
            </CardContent>
        </Card>
    );
  }

  // We require an authenticated Firebase Auth user to proceed with Storage operations
  // This is because password-based sessions are not "authenticated" in a way
  // that Firebase Storage security rules can easily verify.
  if (!authUser) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Update your display name and profile picture.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Profile picture management is only available when logged in with a Google account.
                </p>
            </CardContent>
        </Card>
      )
  }

  return <ProfileUploader authUser={authUser} />
}


function ProfileUploader({ authUser }: { authUser: FirebaseAuthUser }) {
  const { adminUser, updateAdminUser, loading: adminLoading } = useAdminUser();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adminUser) {
      setDisplayName(adminUser.displayName || '');
    }
  }, [adminUser]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop state
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setShowCropDialog(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };
  
  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  const handleProfileSave = async () => {
    try {
      await updateAdminUser({ displayName });
      toast({
        title: "Profile Updated",
        description: "Your display name has been saved.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your display name.",
      });
    }
  };

  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current || !storage) return;

    setIsUploading(true);
    try {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        if (!croppedBlob) {
            throw new Error("Could not process the image.");
        }

        const profilePicRef = storageRef(storage, `profile-pictures/${authUser.uid}`);
        const snapshot = await uploadBytes(profilePicRef, croppedBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await updateAdminUser({ photoURL: downloadURL });
        
        toast({
            title: "Profile Picture Updated",
            description: "Your new picture has been saved.",
        });

    } catch (error: any) {
        console.error("Upload failed", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error.message || "Could not upload the image.",
        });
    } finally {
        setIsUploading(false);
        setShowCropDialog(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!storage || !adminUser?.photoURL) {
      toast({ variant: "destructive", title: "Error", description: "No picture to remove." });
      return;
    }
    setIsDeleting(true);
    try {
        const profilePicRef = storageRef(storage, `profile-pictures/${authUser.uid}`);
        await deleteObject(profilePicRef);
        await updateAdminUser({ photoURL: "" });
        toast({
            title: "Profile Picture Removed",
            description: "Your picture has been removed.",
        });
    } catch(error: any) {
        // If file doesn't exist, we can just clear the URL from DB
        if (error.code === 'storage/object-not-found') {
             await updateAdminUser({ photoURL: "" });
             toast({
                title: "Profile Picture Removed",
                description: "Your picture has been removed.",
            });
        } else {
            console.error("Failed to remove picture", error);
            toast({
                variant: "destructive",
                title: "Removal Failed",
                description: "Could not remove the profile picture.",
            });
        }
    } finally {
        setIsDeleting(false);
    }
  }
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                  <AvatarImage src={adminUser?.photoURL || undefined} />
                  <AvatarFallback>{getInitials(adminUser?.displayName)}</AvatarFallback>
              </Avatar>
               <div className="flex flex-col gap-2">
                  <Label htmlFor="picture">Change Profile Picture</Label>
                  <Input id="picture" type="file" accept="image/*" ref={fileInputRef} onChange={onFileSelect} className="max-w-xs" />
                   {adminUser?.photoURL && (
                    <Button variant="outline" size="sm" onClick={handleRemovePicture} disabled={isDeleting} className="w-fit">
                        {isDeleting ? 'Removing...' : 'Remove Picture'}
                    </Button>
                   )}
              </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input 
                  id="display-name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  disabled={adminLoading}
              />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleProfileSave} disabled={adminLoading}>Save Profile</Button>
        </CardFooter>
      </Card>

      {showCropDialog && (
          <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
              <DialogContent className="max-w-md">
                  <DialogHeader>
                      <DialogTitle>Crop Your Image</DialogTitle>
                  </DialogHeader>
                  {imgSrc && (
                      <div className="flex justify-center">
                          <ReactCrop
                              crop={crop}
                              onChange={(_, percentCrop) => setCrop(percentCrop)}
                              onComplete={(c) => setCompletedCrop(c)}
                              aspect={1}
                              circularCrop
                          >
                              <img
                                  ref={imgRef}
                                  alt="Crop me"
                                  src={imgSrc}
                                  onLoad={onImageLoad}
                                  className="max-h-[70vh]"
                              />
                          </ReactCrop>
                      </div>
                  )}
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleCropAndUpload} disabled={isUploading}>
                          {isUploading ? 'Uploading...' : 'Save and Upload'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}


function SettingsPageContent() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your library's settings and preferences.
          </p>
        </div>

        <ProfileSettings />
        
        <Card>
            <CardHeader>
                <CardTitle>Library Policy</CardTitle>
                <CardDescription>Define the rules for borrowing and returning books.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label htmlFor="loan-period">Standard Loan Period</Label>
                        <p className="text-sm text-muted-foreground">The default number of days a member can borrow a book.</p>
                    </div>
                    <Input id="loan-period" type="number" defaultValue="14" className="w-24" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                     <div className="space-y-1">
                        <Label htmlFor="fine-rate">Overdue Fine Rate</Label>
                        <p className="text-sm text-muted-foreground">The fine amount charged per day for an overdue book.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input id="fine-rate" type="number" step="0.1" defaultValue="0.50" className="w-24" />
                    </div>
                </div>
                 <Separator />
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Allow Renewals</Label>
                        <p className="text-sm text-muted-foreground">Let members extend their loan period for books.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button>Save Policy</Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">Choose the appearance of the application.</p>
                    </div>
                    <ClientThemeSwitcher />
                </div>
                
                 <Separator />
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable or disable email notifications for members.</p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button>Save Settings</Button>
            </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}


export default function SettingsPage() {
    return (
        <AdminUserProvider>
            <SettingsPageContent />
        </AdminUserProvider>
    )
}
