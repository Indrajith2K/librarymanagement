
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
import { useStorage } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

function SettingsPageContent() {
  const { adminUser, adminUserDocId, updateAdminUser, loading } = useAdminUser();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      // Reset file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };
  
  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

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

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  const handleProfileSave = async () => {
    if (loading) return;

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
    if (!completedCrop || !imgRef.current || !storage || !adminUserDocId) {
      return;
    }

    setIsUploading(true);
    const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
    
    if (!croppedBlob) {
        toast({ variant: "destructive", title: "Crop Failed", description: "Could not process the image." });
        setIsUploading(false);
        return;
    }

    const profilePicRef = storageRef(storage, `profile-pictures/${adminUserDocId}.png`);

    try {
        const snapshot = await uploadBytes(profilePicRef, croppedBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await updateAdminUser({ photoURL: downloadURL });
        
        toast({
            title: "Profile Picture Updated",
            description: "Your new picture has been saved.",
        });

    } catch (error) {
        console.error("Upload failed", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload the image. Please check storage rules.",
        });
    } finally {
        setIsUploading(false);
        setShowCropDialog(false);
    }
  };
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your library's settings and preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Update your display name and profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={adminUser?.photoURL || `https://i.pravatar.cc/150?u=${adminUser?.staffId || adminUser?.email}`} />
                    <AvatarFallback>{getInitials(adminUser?.displayName)}</AvatarFallback>
                </Avatar>
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="picture">Change Profile Picture</Label>
                    <Input id="picture" type="file" accept="image/*" ref={fileInputRef} onChange={onFileSelect} className="max-w-xs" />
                    <p className="text-xs text-muted-foreground">Select an image to upload and crop.</p>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input 
                    id="display-name" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    disabled={loading}
                />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleProfileSave} disabled={loading}>Save Profile</Button>
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
