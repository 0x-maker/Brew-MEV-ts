"use client"

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { BotSettings, getBotSettings, updateBotSettings } from '../lib/bot-settings';

interface SettingsFallbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: BotSettings | null;
  onSave: (settings: BotSettings) => void;
}

export default function SettingsFallback({
  open,
  onOpenChange,
  initialSettings,
  onSave
}: SettingsFallbackProps) {
  console.log("SettingsFallback rendered with open:", open);
  const defaultSettings = getBotSettings();
  const [settings, setSettings] = useState<BotSettings>(initialSettings || defaultSettings);

  const handleSave = () => {
    // Save settings
    const updatedSettings = updateBotSettings(settings);
    onSave(updatedSettings);
    onOpenChange(false);
  };

  const handleChange = (field: keyof BotSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Bot Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="marketCap" className="text-right">
              Market Cap Filter
            </Label>
            <div className="col-span-3">
              <Input
                id="marketCap"
                type="number"
                value={settings.marketCapFilter}
                onChange={(e) => handleChange('marketCapFilter', Number(e.target.value))}
                min="0"
                step="100000"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stopLoss" className="text-right">
              Stop Loss (%)
            </Label>
            <div className="col-span-3">
              <Input
                id="stopLoss"
                type="number"
                value={settings.stopLoss}
                onChange={(e) => handleChange('stopLoss', Number(e.target.value))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeProfit" className="text-right">
              Take Profit (%)
            </Label>
            <div className="col-span-3">
              <Input
                id="takeProfit"
                type="number"
                value={settings.takeProfit}
                onChange={(e) => handleChange('takeProfit', Number(e.target.value))}
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="autoBuy" className="text-right">
              Auto Buy
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="autoBuy"
                checked={settings.autoBuy}
                onCheckedChange={(checked: boolean) => handleChange('autoBuy', checked)}
              />
              <span className="text-sm">
                {settings.autoBuy ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 