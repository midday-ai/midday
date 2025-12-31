'use client'

import { Button } from '@midday/ui/button'
import { Input } from '@midday/ui/input'
import { Label } from '@midday/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@midday/ui/select'
import { Textarea } from '@midday/ui/textarea'

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
        <div className="pt-12 sm:pt-16 lg:pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-serif text-xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-foreground">
                Support
              </h1>
            </div>

          <form className="space-y-6">
            {/* Email and Full Name - Two Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-sm text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="font-sans"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-sans text-sm text-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="font-sans"
                />
              </div>
            </div>

            {/* Subject - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-sans text-sm text-foreground">
                Subject
              </Label>
              <Input
                id="subject"
                type="text"
                placeholder="Summary of the problem you have"
                className="font-sans"
              />
            </div>

            {/* Product and Severity - Two Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product" className="font-sans text-sm text-foreground">
                  Product
                </Label>
                <Select>
                  <SelectTrigger id="product" className="font-sans">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midday">Midday</SelectItem>
                    <SelectItem value="engine">Engine</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity" className="font-sans text-sm text-foreground">
                  Severity
                </Label>
                <Select>
                  <SelectTrigger id="severity" className="font-sans">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="message" className="font-sans text-sm text-foreground">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                className="font-sans min-h-[120px]"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-start sm:justify-start">
              <Button
                type="submit"
                className="w-full sm:w-auto font-sans text-sm py-3 px-4"
              >
                Submit
              </Button>
            </div>
          </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

