
import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';

import {
  House,
  Users,
  PawPrint,
  Scissors,
  CalendarDays,
  Store,
  LogOut,
} from 'lucide-react';

import { TOKEN_KEY } from '../services/api';

const menuItems = [
  { label: 'Visão geral', to: '/home', icon: House },
  { label: 'Tutores', to: '/tutores', icon: Users },
  { label: 'Animais', to: '/animais', icon: PawPrint },
  { label: 'Serviços', to: '/servicos', icon: Scissors },
  { label: 'Agendamentos', to: '/agendamentos', icon: CalendarDays },
];

export default function AppLayout() {
  const [opened, setOpened] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Encerra a sessão do usuário
  function sair() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('petcare_usuario');

    setOpened(false);

    navigate('/login', { replace: true });
  }

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      {/* Cabeçalho */}
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={() => setOpened((value) => !value)}
              hiddenFrom="sm"
              size="sm"
            />

            <Group gap={8}>
              <ThemeIcon size={36} radius="md" color="teal">
                <Store size={21} />
              </ThemeIcon>

              <Text fw={800} size="lg">
                PetCare
              </Text>
            </Group>
          </Group>

          {/* Informações do usuário e botão sair */}
          <Group gap="sm">
            <Avatar color="teal" radius="xl">
              P
            </Avatar>

            <div>
              <Text size="sm" fw={600}>
                Área administrativa
              </Text>

              <Text size="xs" c="dimmed">
                Sistema de gestão
              </Text>
            </div>

            <Button
              variant="subtle"
              color="gray"
              size="sm"
              leftSection={<LogOut size={17} />}
              onClick={sair}
            >
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Menu lateral */}
      <AppShell.Navbar p="md">
        <Stack h="100%" justify="space-between">
          <Stack gap="lg">

            {/* Identidade do sistema */}
            <Group gap="sm">
              <ThemeIcon size={42} radius="md" color="teal">
                <PawPrint size={24} />
              </ThemeIcon>

              <div>
                <Text fw={800}>PetCare</Text>

                <Text size="xs" c="dimmed">
                  Gestão Pet Shop
                </Text>
              </div>
            </Group>

            {/* Navegação */}
            <Stack gap={5}>
              <Text size="xs" fw={700} c="dimmed">
                MENU PRINCIPAL
              </Text>

              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    label={item.label}
                    leftSection={
                      <Icon size={19} strokeWidth={1.8} />
                    }
                    active={location.pathname === item.to}
                    onClick={() => {
                      navigate(item.to);
                      setOpened(false);
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          {/* Rodapé do menu */}
          <Text size="xs" c="dimmed">
            PetCare · Sistema de gerenciamento
          </Text>
        </Stack>
      </AppShell.Navbar>

      {/* Conteúdo das páginas */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
