import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type AppSettings = {
  currency: 'NLe';
  nassitRatePercent: number; // employee rate
  nassitAnnualCap?: number | null;
  showDeductionsCapNote: boolean;
  pdfIncludeTaxpayerName: boolean;
  theme: 'system' | 'light' | 'dark';
};

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'NLe',
  nassitRatePercent: 5,
  nassitAnnualCap: null,
  showDeductionsCapNote: true,
  pdfIncludeTaxpayerName: true,
  theme: 'system',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {}
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
          <CardDescription>Configure Sierra Leone PAYE preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Display Currency</Label>
              <Select value={settings.currency} onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NLe">NLe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nassitRate">NASSIT Employee Rate (%)</Label>
              <Input
                id="nassitRate"
                type="number"
                step="0.1"
                value={settings.nassitRatePercent}
                onChange={(e) => setSettings((s) => ({ ...s, nassitRatePercent: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="nassitCap">NASSIT Annual Cap (optional)</Label>
              <Input
                id="nassitCap"
                type="number"
                step="0.01"
                placeholder="leave blank for none"
                value={settings.nassitAnnualCap ?? ''}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    nassitAnnualCap: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <Label>Show deductions cap note</Label>
                <p className="text-sm text-muted-foreground">Display a note when deductions are capped to income</p>
              </div>
              <Switch
                checked={settings.showDeductionsCapNote}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, showDeductionsCapNote: !!checked }))}
              />
            </div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <Label>PDF include taxpayer name</Label>
                <p className="text-sm text-muted-foreground">Adds your name/email to generated PDFs</p>
              </div>
              <Switch
                checked={settings.pdfIncludeTaxpayerName}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, pdfIncludeTaxpayerName: !!checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'system' | 'light' | 'dark') => setSettings((s) => ({ ...s, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}


