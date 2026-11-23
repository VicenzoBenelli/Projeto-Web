
import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

import { useNavigate } from 'react-router-dom';

import {
  Users,
  PawPrint,
  Scissors,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

const modules = [
  {
    title: 'Tutores',
    description: 'Gerencie os responsáveis pelos animais.',
    path: '/tutores',
    icon: Users,
  },
  {
    title: 'Animais',
    description: 'Cadastre e organize os animais.',
    path: '/animais',
    icon: PawPrint,
  },
  {
    title: 'Serviços',
    description: 'Gerencie os serviços oferecidos.',
    path: '/servicos',
    icon: Scissors,
  },
  {
    title: 'Agendamentos',
    description: 'Organize os horários e atendimentos.',
    path: '/agendamentos',
    icon: CalendarDays,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <Stack gap="xl">

      <div>
        <Text size="sm" c="teal" fw={700}>
          VISÃO GERAL
        </Text>

        <Title order={1} mt="xs">
          Bem-vindo ao PetCare!
        </Title>

        <Text c="dimmed" mt="xs">
          Gerencie tutores, animais, serviços e agendamentos
          em um só lugar.
        </Text>
      </div>

      <div>
        <Title order={3} mb="md">
          Módulos do sistema
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Card
                key={module.path}
                withBorder
                radius="lg"
                padding="lg"
                shadow="sm"
              >
                <Group justify="space-between" align="center">
                  <Group gap="md">
                    <ThemeIcon
                      size={48}
                      radius="md"
                      variant="light"
                      color="teal"
                    >
                      <Icon size={24} strokeWidth={1.8} />
                    </ThemeIcon>

                    <div>
                      <Text fw={700}>
                        {module.title}
                      </Text>

                      <Text size="sm" c="dimmed">
                        {module.description}
                      </Text>
                    </div>
                  </Group>

                  <Button
                    color="teal"
                    variant="light"
                    rightSection={<ArrowRight size={16} />}
                    onClick={() => navigate(module.path)}
                  >
                    Acessar
                  </Button>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      </div>

    </Stack>
  );
}
