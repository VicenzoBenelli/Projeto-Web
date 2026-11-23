
import { Badge, Paper, Stack, Text, Title } from '@mantine/core';

type Props = {
  titulo: string;
  descricao: string;
};

export default function ModuloEmConstrucao({
  titulo,
  descricao,
}: Props) {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>{titulo}</Title>
        <Text c="dimmed" mt="xs">
          {descricao}
        </Text>
      </div>

      <Paper withBorder radius="lg" p="xl">
        <Stack gap="sm">
          <Badge color="yellow" w="fit-content">
            Em desenvolvimento
          </Badge>

          <Title order={3}>
            Estamos preparando esta área!
          </Title>

          <Text c="dimmed">
            Aqui ficará a funcionalidade de {titulo.toLowerCase()}.
            Em breve, você poderá gerenciar esses registros
            diretamente pelo sistema.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
