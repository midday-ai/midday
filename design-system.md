# Midday Design System

> Documentação completa do design system extraído do repositório Midday

**Versão:** 1.0.0
**Data de Extração:** 2025-11-14
**Framework:** Next.js 15.5.2 + React 19.1.1
**Arquitetura:** Monorepo (Turbo + Bun Workspaces)
**Estilização:** Tailwind CSS + CVA (Class Variance Authority)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Quick Start](#quick-start)
3. [Tokens de Design](#tokens-de-design)
4. [Componentes](#componentes)
5. [Padrões e Convenções](#padrões-e-convenções)
6. [Utilities e Hooks](#utilities-e-hooks)
7. [Configuração](#configuração)
8. [Estilos Customizados](#estilos-customizados)

---

## Visão Geral

O Midday Design System é um sistema de design moderno e escalável construído sobre fundações sólidas:

- **42+ Componentes** reutilizáveis e acessíveis
- **Radix UI** como base para primitivos WAI-ARIA compliant
- **Tailwind CSS** para estilização utilitária
- **CVA** para gerenciamento type-safe de variantes
- **Dark Mode** nativo com suporte completo
- **Next.js 15** com App Router e React Server Components
- **Monorepo** para modularidade e compartilhamento

### Arquitetura

```
midday-fork/
├── packages/
│   └── ui/                    # 🎨 Design System Principal
│       ├── src/
│       │   ├── components/    # 42+ componentes
│       │   ├── hooks/         # Custom hooks
│       │   ├── utils/         # Utilities (cn, truncate)
│       │   └── globals.css    # Tokens CSS Variables
│       ├── tailwind.config.ts
│       └── package.json
├── apps/
│   ├── dashboard/             # App principal
│   └── website/               # Site marketing
└── design-system.json         # Documentação estruturada
```

---

## Quick Start

### Instalação

O design system está disponível como package interno `@midday/ui`:

```json
{
  "dependencies": {
    "@midday/ui": "workspace:*"
  }
}
```

### Uso Básico

```tsx
// Importar componentes individualmente (tree-shaking otimizado)
import { Button } from "@midday/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";

// Importar estilos globais
import "@midday/ui/globals.css";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello Midday</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="lg">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Configurar Tailwind

```ts
// tailwind.config.ts
import baseConfig from "@midday/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
} satisfies Config;
```

---

## Tokens de Design

### Cores

Todas as cores são definidas como **CSS Variables em formato HSL**, permitindo manipulação fácil de opacidade e tema.

#### Light Mode

| Token | Valor HSL | Hex Aproximado | Uso |
|-------|-----------|----------------|-----|
| `--background` | `0, 0%, 100%` | `#FFFFFF` | Background principal |
| `--foreground` | `0, 0%, 7%` | `#121212` | Texto principal |
| `--primary` | `240 5.9% 10%` | `#171923` | Ações primárias |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Texto em primary |
| `--secondary` | `40, 11%, 89%` | `#E8E4DD` | Ações secundárias |
| `--muted` | `40, 11%, 89%` | `#E8E4DD` | Backgrounds muted |
| `--muted-foreground` | `0, 0%, 38%` | `#616161` | Texto muted |
| `--accent` | `40, 10%, 94%` | `#F1EEEA` | Hover states |
| `--destructive` | `0 84.2% 60.2%` | `#E64646` | Ações destrutivas |
| `--border` | `45, 5%, 85%` | `#D9D7D3` | Bordas padrão |
| `--input` | `240 5.9% 90%` | `#E4E4E7` | Input backgrounds |
| `--ring` | `240 5.9% 10%` | `#171923` | Focus rings |

#### Dark Mode

| Token | Valor HSL | Hex Aproximado | Uso |
|-------|-----------|----------------|-----|
| `--background` | `0, 0%, 7%` | `#121212` | Background principal |
| `--foreground` | `0 0% 98%` | `#FAFAFA` | Texto principal |
| `--primary` | `0 0% 98%` | `#FAFAFA` | Ações primárias |
| `--secondary` | `0, 0%, 11%` | `#1C1C1C` | Ações secundárias |
| `--muted` | `0, 0%, 11%` | `#1C1C1C` | Backgrounds muted |
| `--accent` | `0, 0%, 11%` | `#1C1C1C` | Hover states |
| `--destructive` | `359, 100%, 61%` | `#FF3B3B` | Ações destrutivas |
| `--border` | `0, 0%, 17%` | `#2B2B2B` | Bordas padrão |

#### Uso em Tailwind

```tsx
// Classes geradas automaticamente
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Click me
  </button>
</div>

// Com opacidade
<div className="bg-primary/50 border-border/30">
  Semi-transparent
</div>
```

### Tipografia

#### Famílias de Fonte

| Família | Fonte | Pesos | Uso |
|---------|-------|-------|-----|
| `sans` | Geist Sans | Variable | Fonte principal UI |
| `mono` | Geist Mono | Variable | Code, badges |
| `serif` | Lora | 400 | Conteúdo editorial |

#### Tamanhos

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `text-xs` | 0.75rem (12px) | Tags, labels pequenos |
| `text-sm` | 0.875rem (14px) | Body text, inputs |
| `text-base` | 1rem (16px) | Padrão |
| `text-lg` | 1.125rem (18px) | Títulos de card |
| `text-xl` | 1.25rem (20px) | Títulos maiores |
| `text-2xl` | 1.5rem (24px) | Page headers |

#### Aplicação de Fontes

```tsx
// No layout principal
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Lora } from "next/font/google";

const lora = Lora({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

<body className={`${GeistSans.variable} ${GeistMono.variable} ${lora.variable} font-sans`}>
  {children}
</body>
```

### Espaçamento

Tailwind spacing scale padrão (incrementos de 0.25rem):

| Classe | Valor | Pixels |
|--------|-------|--------|
| `p-1` | 0.25rem | 4px |
| `p-2` | 0.5rem | 8px |
| `p-3` | 0.75rem | 12px |
| `p-4` | 1rem | 16px |
| `p-6` | 1.5rem | 24px |
| `p-8` | 2rem | 32px |
| `p-12` | 3rem | 48px |

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius` | `0.5rem` (8px) | Base |
| `rounded-lg` | `var(--radius)` | Cards, dialogs |
| `rounded-md` | `calc(var(--radius) - 2px)` | Buttons, inputs |
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small elements |
| `rounded-full` | `9999px` | Círculos, pills |

### Sombras

```css
/* Tailwind defaults */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
```

### Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |
| `3xl` | 1800px | **Custom** - Ultra wide |

---

## Componentes

### Categorias

- **Actions:** Button, SubmitButton
- **Display:** Avatar, Badge, Card, Icons, Skeleton, Table, Chart
- **Feedback:** Alert, Progress, Spinner, Toast, Toaster
- **Forms:** Input, Textarea, Select, Checkbox, Radio, Switch, Calendar, DateRangePicker, CurrencyInput, QuantityInput, TimeRangeInput, Form, Label, InputOTP
- **Layout:** Card, Separator, ScrollArea, AnimatedSizeContainer
- **Navigation:** NavigationMenu, Tabs, Command
- **Overlay:** Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, DropdownMenu, ContextMenu, Tooltip
- **Disclosure:** Accordion, Collapsible

---

### Button

**Path:** `packages/ui/src/components/button.tsx`

Componente de botão versátil com múltiplas variantes e tamanhos.

#### Variantes

| Variant | Aparência |
|---------|-----------|
| `default` | Fundo primary, texto branco |
| `destructive` | Fundo vermelho, ações destrutivas |
| `outline` | Border, fundo transparente |
| `secondary` | Fundo secondary cinza |
| `ghost` | Sem fundo, apenas hover |
| `link` | Texto com underline |

#### Tamanhos

| Size | Altura | Padding |
|------|--------|---------|
| `default` | 36px (h-9) | px-4 py-2 |
| `sm` | 32px (h-8) | px-3, text-xs |
| `lg` | 40px (h-10) | px-8 |
| `icon` | 36px (h-9 w-9) | Quadrado |

#### Exemplo

```tsx
import { Button } from "@midday/ui/button";

// Variantes
<Button variant="default">Default Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconPlus /></Button>

// Com asChild (composição)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// Estados
<Button disabled>Disabled</Button>
```

#### Props

```tsx
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean; // Renderiza como Slot para composição
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

### Badge

**Path:** `packages/ui/src/components/badge.tsx`

Badge para labels, tags e indicadores de status.

#### Variantes

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outlined</Badge>
<Badge variant="tag">Tag</Badge>
<Badge variant="tag-rounded">Rounded Tag</Badge>
```

| Variant | Estilo |
|---------|--------|
| `default` | Primary background |
| `secondary` | Secondary background |
| `destructive` | Red background |
| `outline` | Mono font, border |
| `tag` | Cinza, mono, sem border-radius |
| `tag-rounded` | Como tag, com border-radius |

---

### Card

**Path:** `packages/ui/src/components/card.tsx`

Container para agrupar conteúdo relacionado.

#### Composição

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@midday/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main card content goes here</p>
  </CardContent>
  <CardFooter>
    <p>Footer information</p>
  </CardFooter>
</Card>
```

---

### Input

**Path:** `packages/ui/src/components/input.tsx`

Input de texto com estilização consistente.

```tsx
import { Input } from "@midday/ui/input";

<Input type="text" placeholder="Enter your name" />
<Input type="email" placeholder="email@example.com" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled input" />
```

---

### Dialog

**Path:** `packages/ui/src/components/dialog.tsx`

Modal dialog com overlay e animações.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@midday/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Sem botão de fechar
<DialogContent hideClose>
  ...
</DialogContent>

// Frameless (sem padding/border interno)
<DialogContentFrameless>
  ...
</DialogContentFrameless>
```

---

### Select

**Path:** `packages/ui/src/components/select.tsx`

Dropdown select nativo com estilização customizada.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@midday/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="orange">Orange</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// Sem ícone de dropdown
<SelectTrigger hideIcon>
  <SelectValue placeholder="Choose..." />
</SelectTrigger>
```

---

### Toast

**Path:** `packages/ui/src/components/toast.tsx` + `toaster.tsx`

Sistema de notificações toast com múltiplas variantes.

#### Setup

```tsx
// No layout raiz
import { Toaster } from "@midday/ui/toaster";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

#### Uso

```tsx
import { useToast } from "@midday/ui/use-toast";

function MyComponent() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Your changes have been saved.",
          variant: "success"
        });
      }}
    >
      Save
    </Button>
  );
}
```

#### Variantes

```tsx
// Success
toast({ variant: "success", title: "Done!" });

// Error
toast({ variant: "error", title: "Oops!", description: "Something went wrong" });

// Progress (com barra de progresso)
toast({ variant: "progress", progress: 75, title: "Uploading..." });

// Spinner (loading)
toast({ variant: "spinner", title: "Processing..." });

// AI (com ícone especial)
toast({ variant: "ai", title: "AI generated response" });

// Destructive
toast({ variant: "destructive", title: "Deleted", description: "Item removed" });
```

---

### Form

**Path:** `packages/ui/src/components/form.tsx`

Integração com React Hook Form.

```tsx
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Button } from "@midday/ui/button";

function MyForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="john_doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

### Sheet

**Path:** `packages/ui/src/components/sheet.tsx`

Painel lateral deslizante (slide-out).

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@midday/ui/sheet";

// Painel direito (padrão)
<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Settings</SheetTitle>
      <SheetDescription>Manage your preferences</SheetDescription>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>

// Outros lados
<SheetContent side="left">...</SheetContent>
<SheetContent side="top">...</SheetContent>
<SheetContent side="bottom">...</SheetContent>
```

#### Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Lado de origem |
| `stack` | `boolean` | `false` | Stack mode |

---

### Accordion

**Path:** `packages/ui/src/components/accordion.tsx`

Componente de expansão/colapso.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@midday/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Múltiplos abertos simultaneamente
<Accordion type="multiple">
  ...
</Accordion>
```

---

### Calendar & DateRangePicker

**Path:** `packages/ui/src/components/calendar.tsx` + `date-range-picker.tsx`

Seletor de datas com suporte a ranges.

```tsx
import { Calendar } from "@midday/ui/calendar";
import { DateRangePicker } from "@midday/ui/date-range-picker";

// Calendário simples
function MyCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  );
}

// Range picker
function MyRangePicker() {
  const [range, setRange] = useState({ from: undefined, to: undefined });

  return (
    <DateRangePicker
      range={range}
      onSelect={setRange}
      placeholder="Select date range"
    />
  );
}
```

---

### Combobox & MultipleSelector

**Path:** `packages/ui/src/components/combobox.tsx` + `multiple-selector.tsx`

Autocomplete com busca e criação de itens.

```tsx
import { Combobox } from "@midday/ui/combobox";

<Combobox
  options={[
    { id: "1", name: "Option 1" },
    { id: "2", name: "Option 2" }
  ]}
  value={selectedOption}
  onSelect={(option) => setSelectedOption(option)}
  onCreate={(name) => createNewOption(name)}
  isLoading={isLoading}
  placeholder="Search or create..."
/>

// Multi-select
import { MultipleSelector } from "@midday/ui/multiple-selector";

<MultipleSelector
  value={selectedItems}
  onChange={setSelectedItems}
  defaultOptions={options}
  onSearch={async (query) => {
    // Async search
    return await fetchOptions(query);
  }}
  maxSelected={5}
  creatable
/>
```

---

### Chart

**Path:** `packages/ui/src/components/chart.tsx`

Wrapper type-safe para Recharts com theming integrado.

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@midday/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  }
};

<ChartContainer config={chartConfig}>
  <BarChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="revenue" fill="var(--color-revenue)" />
    <Bar dataKey="expenses" fill="var(--color-expenses)" />
  </BarChart>
</ChartContainer>
```

---

### DropdownMenu

**Path:** `packages/ui/src/components/dropdown-menu.tsx`

Menu dropdown com suporte a submenus, checkboxes e radio groups.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@midday/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>

    {/* Submenu */}
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Export</DropdownMenuItem>
        <DropdownMenuItem>Import</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>

    <DropdownMenuSeparator />

    {/* Checkbox */}
    <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
      Show Panel
    </DropdownMenuCheckboxItem>

    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Tabs

**Path:** `packages/ui/src/components/tabs.tsx`

Navegação por abas.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@midday/ui/tabs";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <p>Overview content</p>
  </TabsContent>

  <TabsContent value="analytics">
    <p>Analytics content</p>
  </TabsContent>

  <TabsContent value="reports">
    <p>Reports content</p>
  </TabsContent>
</Tabs>
```

---

### Table

**Path:** `packages/ui/src/components/table.tsx`

Componentes semânticos para tabelas.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@midday/ui/table";

<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Outros Componentes

#### Avatar
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@midday/ui/avatar";

<Avatar>
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

#### Checkbox
```tsx
import { Checkbox } from "@midday/ui/checkbox";

<Checkbox id="terms" />
<label htmlFor="terms">Accept terms and conditions</label>
```

#### Switch
```tsx
import { Switch } from "@midday/ui/switch";

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

#### Progress
```tsx
import { Progress } from "@midday/ui/progress";

<Progress value={progress} /> {/* 0-100 */}
```

#### Spinner
```tsx
import { Spinner } from "@midday/ui/spinner";

<Spinner size={24} />
```

#### Skeleton
```tsx
import { Skeleton } from "@midday/ui/skeleton";

<Skeleton className="h-12 w-full" animate />
```

#### Tooltip
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@midday/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Helpful information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Padrões e Convenções

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `Button`, `AlertDialog` |
| Arquivos | kebab-case.tsx | `button.tsx`, `alert-dialog.tsx` |
| CSS Variables | kebab-case com `--` | `--background`, `--primary` |
| Utilities | camelCase | `cn`, `truncate` |
| Hooks | camelCase com `use` | `useMediaQuery`, `useToast` |

### Estrutura de Arquivos

```
packages/ui/src/
├── components/
│   ├── button.tsx          # Componente + variantes CVA
│   ├── card.tsx            # Componente composto
│   └── ...
├── hooks/
│   ├── use-media-query.ts
│   ├── use-resize-observer.ts
│   └── index.ts            # Re-exports
├── utils/
│   ├── cn.ts               # Merge classes
│   ├── truncate.ts
│   └── index.ts
└── globals.css             # Tokens + animações
```

### Padrões de Exportação

**Granular exports** para tree-shaking otimizado:

```json
{
  "exports": {
    "./button": "./src/components/button.tsx",
    "./card": "./src/components/card.tsx",
    "./cn": "./src/utils/cn.ts",
    "./hooks": "./src/hooks/index.ts"
  },
  "sideEffects": false
}
```

**Uso:**
```tsx
// ✅ Importação granular (otimizada)
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";

// ❌ Evitar barrel imports
import { Button, Card, Input } from "@midday/ui";
```

### Padrões de Composição

#### 1. Radix UI Wrapper

Maioria dos componentes envolve primitivos Radix:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn("custom-styles", className)}
    {...props}
  />
));
```

#### 2. Forward Refs

Todos os componentes usam `React.forwardRef`:

```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn("...", className)} {...props} />;
  }
);
Input.displayName = "Input";
```

#### 3. AsChild Pattern

Usa `@radix-ui/react-slot` para composição:

```tsx
import { Slot } from "@radix-ui/react-slot";

const Button = ({ asChild, ...props }) => {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
};

// Uso
<Button asChild>
  <Link href="/home">Home</Link>
</Button>
```

#### 4. CVA para Variantes

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
      },
      size: {
        sm: "...",
        lg: "...",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

### Estados

#### Radix Data States

```tsx
// Animações baseadas em data-state
data-[state=open]:animate-in
data-[state=closed]:animate-out
```

#### Focus States

```tsx
// Acessibilidade de teclado
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
```

#### Disabled States

```tsx
disabled:opacity-50
disabled:pointer-events-none
disabled:cursor-not-allowed
```

### Theming

#### CSS Variables

```css
:root {
  --primary: 240 5.9% 10%;
}

.dark {
  --primary: 0 0% 98%;
}
```

#### Tailwind Integration

```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  }
}
```

#### Dark Mode

```tsx
// Classe-based
<html className="dark">

// Toggle
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
<button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Toggle
</button>
```

### Acessibilidade

- **WAI-ARIA Compliant:** Radix UI primitivos
- **Keyboard Navigation:** Tab, Enter, Space, Arrow keys
- **Screen Readers:** Semantic HTML + ARIA labels
- **Focus Management:** Focus trapping em modals
- **Color Contrast:** WCAG AA minimum

---

## Utilities e Hooks

### `cn` - Class Name Merge

**Path:** `packages/ui/src/utils/cn.ts`

Combina classes Tailwind de forma segura, resolvendo conflitos.

```tsx
import { cn } from "@midday/ui/cn";

// Merge simples
cn("px-4 py-2", "bg-primary text-white")
// => "px-4 py-2 bg-primary text-white"

// Resolve conflitos (último vence)
cn("px-4", "px-8")
// => "px-8"

// Condicional
cn("base-class", isActive && "active-class", className)

// Uso em componentes
<div className={cn("default-styles", className)} />
```

**Implementação:**
```ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `truncate` - String Truncation

**Path:** `packages/ui/src/utils/truncate.ts`

Trunca strings com ellipsis.

```tsx
import { truncate } from "@midday/ui/truncate";

truncate("Very long text that needs truncation", 20);
// => "Very long text th..."

truncate(null, 10);
// => null

truncate("Short", 100);
// => "Short"
```

### `useMediaQuery` - Responsive Hook

**Path:** `packages/ui/src/hooks/use-media-query.ts`

React hook para media queries responsivas.

```tsx
import { useMediaQuery } from "@midday/ui/hooks";

function MyComponent() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

### `useResizeObserver` - Element Resize

**Path:** `packages/ui/src/hooks/use-resize-observer.ts`

Observa mudanças de tamanho de elementos.

```tsx
import { useResizeObserver } from "@midday/ui/hooks";
import { useRef } from "react";

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useResizeObserver(ref);

  const width = entry?.contentRect.width;
  const height = entry?.contentRect.height;

  return (
    <div ref={ref}>
      Size: {width}x{height}
    </div>
  );
}
```

### `useEnterSubmit` - Form Submit

**Path:** `packages/ui/src/hooks/use-enter-submit.ts`

Submete formulário ao pressionar Enter em textarea (útil para chats).

```tsx
import { useEnterSubmit } from "@midday/ui/hooks";

function ChatInput() {
  const { formRef, onKeyDown } = useEnterSubmit();

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <textarea
        onKeyDown={onKeyDown} // Enter submits, Shift+Enter nova linha
        placeholder="Type a message..."
      />
    </form>
  );
}
```

### `useToast` - Toast Notifications

**Path:** `packages/ui/src/components/use-toast.tsx`

Gerencia notificações toast.

```tsx
import { useToast } from "@midday/ui/use-toast";

function MyComponent() {
  const { toast, toasts, dismiss } = useToast();

  const showSuccess = () => {
    toast({
      title: "Success",
      description: "Operation completed",
      variant: "success"
    });
  };

  const showError = () => {
    const { id } = toast({
      title: "Error",
      description: "Something went wrong",
      variant: "error",
      duration: 5000
    });

    // Dismiss manualmente
    setTimeout(() => dismiss(id), 3000);
  };

  return (
    <>
      <button onClick={showSuccess}>Show Success</button>
      <button onClick={showError}>Show Error</button>
    </>
  );
}
```

---

## Configuração

### Tailwind Config

**Path:** `packages/ui/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  safelist: ["dark", "light"],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
        serif: "var(--font-serif)",
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... mais cores
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Animações customizadas
      },
      animation: {
        // Definições de animação
      },
      screens: {
        "3xl": "1800px", // Custom breakpoint
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### PostCSS Config

**Path:** `packages/ui/postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

---

## Estilos Customizados

### Scrollbar Hiding

```css
/* Classe utility */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

```tsx
<div className="scrollbar-hide overflow-auto">
  Content with hidden scrollbar
</div>
```

### Skeleton Loading

Classes especiais para loading states:

```css
.skeleton-box {
  background-color: hsl(var(--border));
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-circle {
  background-color: hsl(var(--border));
  border-radius: 1000px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

```tsx
<div className="skeleton-box h-12 w-full">
  <p>This text will be hidden</p>
</div>

<div className="skeleton-circle h-12 w-12">
  Avatar placeholder
</div>
```

### Desktop App Styles

Estilos especiais para app desktop (Tauri/Electron):

```css
html.desktop {
  background: transparent;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
}

html.desktop body::before {
  content: "";
  position: fixed;
  border: 0.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  z-index: 100;
  pointer-events: none;
}

html.desktop.dark body::before {
  border: 0.5px solid rgba(255, 255, 255, 0.15);
}
```

### Dotted Background

Backgrounds com padrão de pontos:

```css
.dark .dotted-bg {
  background-image: radial-gradient(
    circle at 1px 1px,
    #232323 0.5px,
    transparent 0
  );
  background-size: 6px 6px;
}

.light .dotted-bg {
  background-image: radial-gradient(
    circle at 1px 1px,
    #e0e0e0 0.5px,
    transparent 0
  );
  background-size: 6px 6px;
}
```

```tsx
<div className="dotted-bg p-8">
  Content with dotted background
</div>
```

### TipTap Editor Customization

```css
.tiptap {
  font-size: 11px;
  line-height: 18px;
}

.ProseMirror-focused p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #434343;
  pointer-events: none;
}
```

### Color Picker (react-colorful)

```css
.color-picker .react-colorful {
  height: 240px;
}

.color-picker .react-colorful__saturation {
  border-radius: 4px 4px 0 0;
}

.color-picker .react-colorful__hue {
  height: 20px;
  border-radius: 0 0 4px 4px;
}

.color-picker .react-colorful__pointer {
  width: 15px;
  height: 15px;
}
```

---

## Animações

### Keyframes Disponíveis

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@keyframes caret-blink {
  0%, 70%, 100% { opacity: 1; }
  20%, 50% { opacity: 0; }
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(0.5rem); }
  75% { transform: translateX(-0.5rem); }
  100% { transform: translateX(0); }
}
```

### Classes de Animação

```tsx
// Shimmer effect
<div className="animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent" />

// Accordion
<AccordionContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up" />

// Caret blink
<span className="animate-caret-blink" />

// Shake (erro)
<input className="invalid animate-shake" />

// Pulse (loading)
<div className="animate-pulse" />

// Spin
<Spinner className="animate-spin" />
```

---

## Boas Práticas

### 1. Use Componentes Compostos

```tsx
// ✅ Bom
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Evitar
<div className="border bg-background p-6">
  <h3 className="text-lg font-medium">Title</h3>
  <p>Content</p>
</div>
```

### 2. Utilize `cn()` para Classes

```tsx
// ✅ Bom
<Button className={cn("custom-class", isActive && "active")} />

// ❌ Evitar
<Button className={`custom-class ${isActive ? "active" : ""}`} />
```

### 3. Forward Refs Apropriadamente

```tsx
// ✅ Bom
const CustomInput = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => <Input ref={ref} {...props} />
);

// ❌ Evitar (perde ref)
const CustomInput = (props: Props) => <Input {...props} />;
```

### 4. Use `asChild` para Composição

```tsx
// ✅ Bom - mantém semântica
<Button asChild>
  <Link href="/home">Home</Link>
</Button>

// ❌ Evitar - quebra semântica
<Link href="/home">
  <Button>Home</Button>
</Link>
```

### 5. Acessibilidade

```tsx
// ✅ Labels associados
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ✅ ARIA labels quando necessário
<Button aria-label="Close dialog">
  <X />
</Button>

// ✅ Focus management
<Dialog>
  <DialogContent> {/* Focus trap automático */}
    ...
  </DialogContent>
</Dialog>
```

---

## Migração / Integração

### Para Projetos Existentes

1. **Instalar dependências**

```bash
bun add tailwindcss postcss autoprefixer
bun add class-variance-authority clsx tailwind-merge
bun add @radix-ui/react-slot
```

2. **Copiar estrutura**

```
src/
├── components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── lib/
│   └── utils.ts  (cn function)
└── styles/
    └── globals.css
```

3. **Configurar Tailwind**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... copiar do design system
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

4. **Copiar CSS Variables**

Copiar conteúdo de `packages/ui/src/globals.css` para seu `globals.css`.

5. **Importar componentes**

```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

---

## Recursos

### Links Úteis

- **Radix UI:** https://www.radix-ui.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **CVA:** https://cva.style/
- **Shadcn UI:** https://ui.shadcn.com/ (inspiração)

### Dependências Principais

| Package | Versão | Uso |
|---------|--------|-----|
| `react` | 19.1.1 | Framework |
| `next` | 15.5.2 | Framework |
| `tailwindcss` | ^3.4.13 | Styling |
| `@radix-ui/*` | ^1.x-2.x | Primitivos |
| `framer-motion` | ^12.18.1 | Animações avançadas |
| `recharts` | ^2.15.3 | Gráficos |

---

## Changelog & Atualizações

Para manter a documentação atualizada:

1. Revisar `packages/ui/package.json` para novas dependências
2. Verificar novos componentes em `packages/ui/src/components/`
3. Checar `globals.css` para novos tokens
4. Atualizar `tailwind.config.ts` se houver novas extensões

---

**Documentação gerada em:** 2025-11-14
**Repositório:** https://github.com/midday-ai/midday
**Pacote:** `@midday/ui` v1.0.0

