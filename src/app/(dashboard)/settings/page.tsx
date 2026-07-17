'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { useShopSettings, useUpdateShopSettings } from '@/features/settings/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const settingsSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  address: z.string().optional().or(z.literal('')),
  contact_number: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  logo_url: z.string().optional().or(z.literal('')),
  tin: z.string().optional().or(z.literal('')),
  dti_bn: z.string().optional().or(z.literal('')),
  business_permit: z.string().optional().or(z.literal('')),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const { data: settings, isLoading } = useShopSettings()
  const updateSettings = useUpdateShopSettings()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shop_name: '',
      address: '',
      contact_number: '',
      email: '',
      logo_url: '',
      tin: '',
      dti_bn: '',
      business_permit: '',
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        shop_name: settings.shop_name || '',
        address: settings.address || '',
        contact_number: settings.contact_number || '',
        email: settings.email || '',
        logo_url: settings.logo_url || '',
        tin: settings.tin || '',
        dti_bn: settings.dti_bn || '',
        business_permit: settings.business_permit || '',
      })
    }
  }, [settings, reset])

  async function onSubmit(data: SettingsFormValues) {
    await updateSettings.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <Card className="max-w-2xl">
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your shop settings</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop_name">Shop Name *</Label>
              <Input id="shop_name" {...register('shop_name')} />
              {errors.shop_name && (
                <p className="text-sm text-red-500">{errors.shop_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input id="contact_number" {...register('contact_number')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" {...register('logo_url')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Business Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tin">TIN (Tax Identification No.)</Label>
            <Input id="tin" {...register('tin')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dti_bn">DTI / Business Registration No.</Label>
            <Input id="dti_bn" {...register('dti_bn')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_permit">Business Permit No.</Label>
            <Input id="business_permit" {...register('business_permit')} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
