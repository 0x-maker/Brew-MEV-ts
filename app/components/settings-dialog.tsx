"use client"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  BotSettings,
  getBotSettings,
  updateBotSettings,
  validateSettings
} from '../lib/bot-settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Check, AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: BotSettings | null;
  onSave: (settings: BotSettings) => void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  initialSettings,
  onSave
}: SettingsDialogProps) {
  console.log('SettingsDialog rendering with props:', { open, initialSettings });
  const [settings, setSettings] = useState<BotSettings>(initialSettings || getBotSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (open && initialSettings) {
      // Load settings when dialog opens
      setSettings(initialSettings);
      setErrors({});
      setSuccessMessage('');
    }
  }, [open, initialSettings]);

  const handleSave = async () => {
    // Validate settings
    const validation = validateSettings(settings);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSaving(true);
    setErrors({});
    
    try {
      // Update settings
      const updatedSettings = updateBotSettings(settings);
      
      // Show success message
      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Notify parent component
      onSave(updatedSettings);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof BotSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if any
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bot Settings</DialogTitle>
          <DialogDescription>
            Configure the MEV bot settings. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Market Cap Filter */}
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
                className={errors.marketCapFilter ? 'border-red-500' : ''}
              />
              {errors.marketCapFilter && (
                <p className="text-red-500 text-xs mt-1">{errors.marketCapFilter}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Minimum market cap (USD) for token detection
              </p>
            </div>
          </div>

          {/* Stop Loss */}
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
                className={errors.stopLoss ? 'border-red-500' : ''}
              />
              {errors.stopLoss && (
                <p className="text-red-500 text-xs mt-1">{errors.stopLoss}</p>
              )}
            </div>
          </div>

          {/* Take Profit */}
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
                className={errors.takeProfit ? 'border-red-500' : ''}
              />
              {errors.takeProfit && (
                <p className="text-red-500 text-xs mt-1">{errors.takeProfit}</p>
              )}
            </div>
          </div>

          {/* Preferred DEX */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferredDex" className="text-right">
              Preferred DEX
            </Label>
            <div className="col-span-3">
              <Select 
                value={settings.preferredDex} 
                onValueChange={(value) => handleChange('preferredDex', value as BotSettings['preferredDex'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select DEX" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Best Price)</SelectItem>
                  <SelectItem value="raydium">Raydium</SelectItem>
                  <SelectItem value="orca">Orca</SelectItem>
                  <SelectItem value="jupiter">Jupiter</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select the preferred DEX for transactions
              </p>
            </div>
          </div>

          {/* Auto Buy */}
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

          {/* Auto Buy Amount (only shown if Auto Buy is enabled) */}
          {settings.autoBuy && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="autoBuyAmount" className="text-right">
                Auto Buy Amount
              </Label>
              <div className="col-span-3">
                <Input
                  id="autoBuyAmount"
                  type="number"
                  value={settings.autoBuyAmount}
                  onChange={(e) => handleChange('autoBuyAmount', Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                  className={errors.autoBuyAmount ? 'border-red-500' : ''}
                />
                {errors.autoBuyAmount && (
                  <p className="text-red-500 text-xs mt-1">{errors.autoBuyAmount}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Amount in SOL to auto-buy when a token is detected
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Success and error messages */}
        {successMessage && (
          <div className="flex items-center gap-2 text-green-600 mb-4 p-2 bg-green-50 rounded">
            <Check className="h-4 w-4" />
            <p className="text-sm">{successMessage}</p>
          </div>
        )}
        
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 mb-4 p-2 bg-red-50 rounded">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{errors.general}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 