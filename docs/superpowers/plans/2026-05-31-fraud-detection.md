# Fraud Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fraud detection system that monitors platform events, evaluates them against configurable rules, and generates signals for administrative review and automated action.

**Architecture:** Event-driven architecture using NestJS EventEmitter. Fraud listeners capture events (registration, bidding, ordering, etc.), and a background processor (BullMQ) evaluates rules to generate FraudSignals. An Admin Controller provides endpoints for managing rules and investigating signals.

**Tech Stack:** NestJS, Prisma, BullMQ, EventEmitter2.

---

### Task 1: Module Scaffolding and Types

**Files:**
- Create: `apps/api/src/fraud/fraud.types.ts`
- Create: `apps/api/src/fraud/dto.ts`
- Create: `apps/api/src/fraud/fraud.module.ts`

- [ ] **Step 1: Define Fraud Types**

```typescript
// apps/api/src/fraud/fraud.types.ts
import { FraudAction, FraudSeverity, FraudSignalStatus } from '@prisma/client';

export interface FraudRuleCondition {
  type: 'COUNT' | 'PATTERN' | 'VELOCITY';
  metric: string;
  threshold: number;
  windowMinutes: number;
  groupBy?: 'IP' | 'USER' | 'DEVICE';
}

export interface FraudSignalEvidence {
  metricValue: number;
  threshold: number;
  details: any;
  context: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}
```

- [ ] **Step 2: Define DTOs**

```typescript
// apps/api/src/fraud/dto.ts
import { IsEnum, IsString, IsOptional, IsJSON, IsBoolean } from 'class-validator';
import { FraudAction, FraudSeverity, FraudSignalStatus } from '@prisma/client';

export class CreateFraudRuleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  condition: any;

  @IsEnum(FraudAction)
  action: FraudAction;

  @IsEnum(FraudSeverity)
  severity: FraudSeverity;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ResolveFraudSignalDto {
  @IsString()
  resolution: string;

  @IsEnum(FraudSignalStatus)
  status: FraudSignalStatus;
}
```

- [ ] **Step 3: Create Module Shell**

```typescript
// apps/api/src/fraud/fraud.module.ts
import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudController } from './fraud.controller';
import { PrismaFraudRepository } from './prisma-fraud.repository';
import { FraudRuleEngine } from './fraud.rule-engine';
import { FraudListeners } from './fraud.listeners';

@Module({
  controllers: [FraudController],
  providers: [
    FraudService,
    PrismaFraudRepository,
    FraudRuleEngine,
    FraudListeners,
  ],
  exports: [FraudService],
})
export class FraudModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/fraud/*.ts
git commit -m "feat(fraud): scaffold fraud module and types"
```

---

### Task 2: Fraud Repository

**Files:**
- Create: `apps/api/src/fraud/prisma-fraud.repository.ts`

- [ ] **Step 1: Implement Repository**

```typescript
// apps/api/src/fraud/prisma-fraud.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FraudRule, FraudSignal, FraudAction, FraudSeverity, FraudSignalStatus } from '@prisma/client';

@Injectable()
export class PrismaFraudRepository {
  constructor(private prisma: PrismaService) {}

  async createRule(data: any): Promise<FraudRule> {
    return this.prisma.fraudRule.create({ data });
  }

  async getEnabledRules(): Promise<FraudRule[]> {
    return this.prisma.fraudRule.findMany({ where: { enabled: true } });
  }

  async createSignal(data: any): Promise<FraudSignal> {
    return this.prisma.fraudSignal.create({ data });
  }

  async getSignals(filters: any) {
    return this.prisma.fraudSignal.findMany({
      where: filters,
      include: { rule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSignal(id: string, data: any): Promise<FraudSignal> {
    return this.prisma.fraudSignal.update({ where: { id }, data });
  }
  
  // Add other necessary methods...
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/fraud/prisma-fraud.repository.ts
git commit -m "feat(fraud): implement prisma-fraud.repository"
```

---

### Task 3: Fraud Rule Engine

**Files:**
- Create: `apps/api/src/fraud/fraud.rule-engine.ts`

- [ ] **Step 1: Implement Rule Engine**

```typescript
// apps/api/src/fraud/fraud.rule-engine.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FraudRule, FraudSignal } from '@prisma/client';

@Injectable()
export class FraudRuleEngine {
  constructor(private prisma: PrismaService) {}

  async evaluateEvent(event: string, payload: any): Promise<void> {
    // 1. Get enabled rules related to this event type
    // 2. Query database for metrics (e.g., registration count for IP in last hour)
    // 3. Compare with rule condition
    // 4. If triggered, create FraudSignal
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/fraud/fraud.rule-engine.ts
git commit -m "feat(fraud): implement basic fraud.rule-engine"
```

---

### Task 4: Fraud Service and Controller

**Files:**
- Create: `apps/api/src/fraud/fraud.service.ts`
- Create: `apps/api/src/fraud/fraud.controller.ts`

- [ ] **Step 1: Implement Service**

```typescript
// apps/api/src/fraud/fraud.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaFraudRepository } from './prisma-fraud.repository';

@Injectable()
export class FraudService {
  constructor(private repository: PrismaFraudRepository) {}

  async getSignals(query: any) {
    return this.repository.getSignals(query);
  }

  async resolveSignal(id: string, userId: string, data: any) {
    return this.repository.updateSignal(id, {
      ...data,
      resolvedById: userId,
      updatedAt: new Date(),
    });
  }
  
  // Add rule management methods...
}
```

- [ ] **Step 2: Implement Controller (Admin Protected)**

```typescript
// apps/api/src/fraud/fraud.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { FraudService } from './fraud.service';

@Controller('v1/admin/fraud')
@UseGuards(AdminGuard)
export class FraudController {
  constructor(private fraudService: FraudService) {}

  @Get('signals')
  async getSignals(@Query() query: any) {
    return this.fraudService.getSignals(query);
  }

  @Patch('signals/:id/resolve')
  async resolveSignal(@Param('id') id: string, @Body() body: any) {
    // In real app, get userId from req.user
    return this.fraudService.resolveSignal(id, 'system-admin', body);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fraud/fraud.service.ts apps/api/src/fraud/fraud.controller.ts
git commit -m "feat(fraud): implement fraud.service and fraud.controller"
```

---

### Task 5: Fraud Listeners

**Files:**
- Create: `apps/api/src/fraud/fraud.listeners.ts`

- [ ] **Step 1: Implement Listeners**

```typescript
// apps/api/src/fraud/fraud.listeners.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FraudRuleEngine } from './fraud.rule-engine';

@Injectable()
export class FraudListeners {
  constructor(private ruleEngine: FraudRuleEngine) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: any) {
    await this.ruleEngine.evaluateEvent('user.registered', payload);
  }

  @OnEvent('auction.bid.placed')
  async handleBidPlaced(payload: any) {
    await this.ruleEngine.evaluateEvent('auction.bid.placed', payload);
  }
  
  // Add other listeners...
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/fraud/fraud.listeners.ts
git commit -m "feat(fraud): implement fraud.listeners"
```

---

### Task 6: Integration and Verification

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Create: `scripts/verify-fraud.ts`

- [ ] **Step 1: Register Module**

Add `FraudModule` to `AppModule`.

- [ ] **Step 2: Create Verification Script**

Write a script to:
1. Create a Fraud Rule.
2. Emit a fake event that triggers the rule.
3. Check if a FraudSignal was created.
4. Resolve the signal via the admin API.

- [ ] **Step 3: Run Verification**

Run: `npx ts-node scripts/verify-fraud.ts`
Expected: ALL TESTS PASS

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/app.module.ts scripts/verify-fraud.ts
git commit -m "feat(fraud): finalize integration and add verification script"
```
